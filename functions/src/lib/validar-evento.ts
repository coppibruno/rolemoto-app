import {
  ERRO_LOCALIZACAO_FORA_DO_SUL,
  pontoEstaNoSul,
} from "./regiao-sul";
import type {Localizacao} from "../types/role";
import {
  ACESSOS_EVENTO,
  ATRACOES_EVENTO,
  TIPOS_EVENTO,
  type AcessoEvento,
  type AtracaoEvento,
  type EventoPublicacao,
  type TipoEvento,
} from "../types/evento";

const LINK_INGRESSO_MAX = 2000;
const MAX_DURACAO_EVENTO_MS = 7 * 24 * 60 * 60 * 1000;

export type ConteudoEvento = {
  titulo: string;
  tipo: TipoEvento;
  local: Localizacao;
  acesso: AcessoEvento;
  linkIngresso: string | null;
  atracoes: AtracaoEvento[];
  fotoCapaUrl: string;
  informacoes: string;
};

const isTipo = (valor: unknown): valor is TipoEvento =>
  typeof valor === "string" && (TIPOS_EVENTO as string[]).includes(valor);

const isAcesso = (valor: unknown): valor is AcessoEvento =>
  typeof valor === "string" && (ACESSOS_EVENTO as string[]).includes(valor);

const parseLinkIngresso = (
  valor: unknown,
  acesso: AcessoEvento,
): {ok: true; link: string | null} | {ok: false; erro: string} => {
  if (acesso !== "ingresso") {
    return {ok: true, link: null};
  }
  if (typeof valor !== "string" || !valor.trim()) {
    return {ok: false, erro: "linkIngresso é obrigatório"};
  }
  const link = valor.trim();
  if (link.length > LINK_INGRESSO_MAX) {
    return {ok: false, erro: "linkIngresso inválido"};
  }
  try {
    const url = new URL(link);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return {ok: false, erro: "linkIngresso inválido"};
    }
  } catch {
    return {ok: false, erro: "linkIngresso inválido"};
  }
  return {ok: true, link};
};

const isCoordLat = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor) && valor >= -90 && valor <= 90;

const isCoordLng = (valor: unknown): valor is number =>
  typeof valor === "number" &&
  Number.isFinite(valor) &&
  valor >= -180 &&
  valor <= 180;

const parseLocal = (valor: unknown): Localizacao | null => {
  if (!valor || typeof valor !== "object") {
    return null;
  }
  const o = valor as Record<string, unknown>;
  if (
    !isCoordLat(o.lat) ||
    !isCoordLng(o.lng) ||
    typeof o.endereco !== "string" ||
    o.endereco.trim().length < 3
  ) {
    return null;
  }
  if (o.nome !== undefined && o.nome !== null && typeof o.nome !== "string") {
    return null;
  }
  return {
    lat: o.lat,
    lng: o.lng,
    endereco: o.endereco.trim(),
    nome: typeof o.nome === "string" ? o.nome.trim() : "",
  };
};

const parseAtracoes = (valor: unknown): AtracaoEvento[] | null => {
  if (valor === undefined || valor === null) {
    return [];
  }
  if (!Array.isArray(valor)) {
    return null;
  }
  const vistos = new Set<string>();
  const itens: AtracaoEvento[] = [];
  for (const item of valor) {
    if (typeof item !== "string" || !(ATRACOES_EVENTO as string[]).includes(item)) {
      return null;
    }
    if (vistos.has(item)) {
      return null;
    }
    vistos.add(item);
    itens.push(item as AtracaoEvento);
  }
  return itens;
};

const parseIsoFuturo = (
  valor: unknown,
): {ok: true; iso: string} | {ok: false; motivo: "invalida" | "passado"} => {
  if (typeof valor !== "string" || !valor.trim()) {
    return {ok: false, motivo: "invalida"};
  }
  const instante = Date.parse(valor);
  if (Number.isNaN(instante)) {
    return {ok: false, motivo: "invalida"};
  }
  if (instante <= Date.now()) {
    return {ok: false, motivo: "passado"};
  }
  return {ok: true, iso: valor};
};

const parseEncerramento = (
  valor: unknown,
  aberturaIso: string,
): {ok: true; iso: string | null} | {ok: false; erro: string} => {
  if (valor === undefined || valor === null) {
    return {ok: true, iso: null};
  }
  if (typeof valor !== "string" || !valor.trim()) {
    return {ok: false, erro: "dataHoraEncerramento inválida"};
  }
  const instante = Date.parse(valor);
  const abertura = Date.parse(aberturaIso);
  if (Number.isNaN(instante) || instante <= abertura) {
    return {ok: false, erro: "dataHoraEncerramento inválida"};
  }
  if (instante - abertura > MAX_DURACAO_EVENTO_MS) {
    return {ok: false, erro: "o evento pode durar no máximo 7 dias"};
  }
  return {ok: true, iso: valor};
};

const corpoDe = (bruto: Record<string, unknown>): ConteudoEvento | {erro: string} => {
  const titulo = typeof bruto.titulo === "string" ? bruto.titulo.trim() : "";
  if (titulo.length < 3 || titulo.length > 80) {
    return {erro: "titulo é obrigatório"};
  }
  if (!isTipo(bruto.tipo)) {
    return {erro: "tipo inválido"};
  }
  const local = parseLocal(bruto.local);
  if (!local) {
    return {erro: "local inválido"};
  }
  if (!pontoEstaNoSul(local.lat, local.lng)) {
    return {erro: ERRO_LOCALIZACAO_FORA_DO_SUL};
  }
  if (!isAcesso(bruto.acesso)) {
    return {erro: "acesso inválido"};
  }
  const linkIngresso = parseLinkIngresso(bruto.linkIngresso, bruto.acesso);
  if (!linkIngresso.ok) {
    return {erro: linkIngresso.erro};
  }
  const atracoes = parseAtracoes(bruto.atracoes);
  if (!atracoes) {
    return {erro: "atracoes inválidas"};
  }
  if (typeof bruto.fotoCapaUrl !== "string" || !bruto.fotoCapaUrl.trim()) {
    return {erro: "fotoCapaUrl é obrigatória"};
  }
  if (
    bruto.informacoes !== undefined &&
    bruto.informacoes !== null &&
    (typeof bruto.informacoes !== "string" || bruto.informacoes.trim().length > 2000)
  ) {
    return {erro: "informacoes inválida"};
  }
  const informacoes =
    typeof bruto.informacoes === "string" ? bruto.informacoes.trim() : "";
  return {
    titulo,
    tipo: bruto.tipo,
    local,
    acesso: bruto.acesso,
    linkIngresso: linkIngresso.link,
    atracoes,
    fotoCapaUrl: bruto.fotoCapaUrl.trim(),
    informacoes,
  };
};

export const validarConteudoEvento = (
  body: unknown,
): {ok: true; dados: ConteudoEvento} | {ok: false; erro: string} => {
  if (!body || typeof body !== "object") {
    return {ok: false, erro: "titulo é obrigatório"};
  }
  const corpo = corpoDe(body as Record<string, unknown>);
  if ("erro" in corpo) {
    return {ok: false, erro: corpo.erro};
  }
  return {ok: true, dados: corpo};
};

export const validarPublicacaoEvento = (
  body: unknown,
): {ok: true; dados: EventoPublicacao} | {ok: false; erro: string} => {
  const conteudo = validarConteudoEvento(body);
  if (!conteudo.ok) {
    return conteudo;
  }
  const bruto = body as Record<string, unknown>;
  const abertura = parseIsoFuturo(bruto.dataHoraAbertura);
  if (!abertura.ok) {
    return {
      ok: false,
      erro: abertura.motivo === "passado" ?
        "a abertura precisa ser no futuro" :
        "dataHoraAbertura inválida",
    };
  }
  const encerramento = parseEncerramento(bruto.dataHoraEncerramento, abertura.iso);
  if (!encerramento.ok) {
    return {ok: false, erro: encerramento.erro};
  }
  return {
    ok: true,
    dados: {
      ...conteudo.dados,
      dataHoraAbertura: abertura.iso,
      dataHoraEncerramento: encerramento.iso,
      localId: null,
      serieId: null,
      ocorrenciaYmd: null,
      ocorrenciaAjustada: false,
      cancelada: false,
    },
  };
};

const MS_DIA = 24 * 60 * 60 * 1000;

/** Par ISO de uma ocorrência de série: fim depois da abertura e duração menor que 24 h. */
export const validarIntervaloOcorrencia = (
  aberturaIso: string,
  fimIso: string,
): {ok: true} | {ok: false; erro: string} => {
  const abertura = Date.parse(aberturaIso);
  const fim = Date.parse(fimIso);
  if (Number.isNaN(abertura) || Number.isNaN(fim) || fim <= abertura) {
    return {ok: false, erro: "o encerramento precisa ser depois da abertura"};
  }
  if (fim - abertura >= MS_DIA) {
    return {ok: false, erro: "a ocorrência precisa durar menos de 24 horas"};
  }
  return {ok: true};
};
