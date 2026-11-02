import {
  ERRO_LOCALIZACAO_FORA_DO_SUL,
  pontoEstaNoSul,
} from "./regiao-sul";
import type {
  CategoriaLocal,
  DiaSemana,
  FacilidadeLocal,
  HorarioDiaLocal,
  LocalPublicacao,
} from "../types/local";
import {
  CATEGORIAS_LOCAL,
  DIAS_SEMANA,
  FACILIDADES_LOCAL,
} from "../types/local";

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const isCategoria = (valor: unknown): valor is CategoriaLocal =>
  typeof valor === "string" && (CATEGORIAS_LOCAL as string[]).includes(valor);

const isCoordLat = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor) && valor >= -90 && valor <= 90;

const isCoordLng = (valor: unknown): valor is number =>
  typeof valor === "number" &&
  Number.isFinite(valor) &&
  valor >= -180 &&
  valor <= 180;

const parseFacilidades = (valor: unknown): FacilidadeLocal[] | null => {
  if (valor === undefined || valor === null) {
    return [];
  }
  if (!Array.isArray(valor)) {
    return null;
  }
  const vistos = new Set<string>();
  const itens: FacilidadeLocal[] = [];
  for (const item of valor) {
    if (typeof item !== "string" || !(FACILIDADES_LOCAL as string[]).includes(item)) {
      return null;
    }
    if (vistos.has(item)) {
      return null;
    }
    vistos.add(item);
    itens.push(item as FacilidadeLocal);
  }
  return itens;
};

const parseHorarios = (
  aberto24h: boolean,
  valor: unknown,
): HorarioDiaLocal[] | null => {
  if (aberto24h) {
    return [];
  }
  if (!Array.isArray(valor) || valor.length !== DIAS_SEMANA.length) {
    return null;
  }
  const vistos = new Set<number>();
  const itens: HorarioDiaLocal[] = [];
  for (const item of valor) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const o = item as Record<string, unknown>;
    if (typeof o.dia !== "number" || !(DIAS_SEMANA as number[]).includes(o.dia)) {
      return null;
    }
    if (vistos.has(o.dia)) {
      return null;
    }
    vistos.add(o.dia);
    if (typeof o.fechado !== "boolean") {
      return null;
    }
    if (o.fechado) {
      itens.push({
        dia: o.dia as DiaSemana,
        fechado: true,
        abertura: null,
        fechamento: null,
      });
      continue;
    }
    if (
      typeof o.abertura !== "string" ||
      typeof o.fechamento !== "string" ||
      !HORA_RE.test(o.abertura) ||
      !HORA_RE.test(o.fechamento)
    ) {
      return null;
    }
    itens.push({
      dia: o.dia as DiaSemana,
      fechado: false,
      abertura: o.abertura,
      fechamento: o.fechamento,
    });
  }
  if (vistos.size !== DIAS_SEMANA.length) {
    return null;
  }
  if (!itens.some((dia) => !dia.fechado)) {
    return null;
  }
  return itens.sort((a, b) => a.dia - b.dia);
};

const LIMITE_FOTOS_LOCAL = 5;
const FOTO_URL_MAX = 2048;

const isUrlHttp = (valor: string): boolean => {
  if (valor.length > 500) {
    return false;
  }
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const urlFotoValida = (valor: string): boolean => {
  if (valor.length === 0 || valor.length > FOTO_URL_MAX) {
    return false;
  }
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

type FotosLocal = {
  fotoFachadaUrl: string;
  fotosUrls: string[];
};

/**
 * Sem `fotosUrls`, a capa legada vira a galeria de um item.
 * Com a lista, a capa passa a ser a primeira URL.
 */
const parseFotos = (
  bruto: Record<string, unknown>,
): {ok: true; fotos: FotosLocal} | {ok: false; erro: string} => {
  let capa = "";
  if (bruto.fotoFachadaUrl !== undefined && bruto.fotoFachadaUrl !== null) {
    if (typeof bruto.fotoFachadaUrl !== "string") {
      return {ok: false, erro: "fotoFachadaUrl inválida"};
    }
    capa = bruto.fotoFachadaUrl.trim();
  }

  if (bruto.fotosUrls === undefined || bruto.fotosUrls === null) {
    return {
      ok: true,
      fotos: {
        fotoFachadaUrl: capa,
        fotosUrls: capa ? [capa] : [],
      },
    };
  }

  if (!Array.isArray(bruto.fotosUrls)) {
    return {ok: false, erro: "fotos inválidas"};
  }
  if (bruto.fotosUrls.length > LIMITE_FOTOS_LOCAL) {
    return {ok: false, erro: "no máximo 5 fotos"};
  }

  const fotosUrls: string[] = [];
  for (const item of bruto.fotosUrls) {
    if (typeof item !== "string" || !urlFotoValida(item.trim())) {
      return {ok: false, erro: "foto inválida"};
    }
    const url = item.trim();
    if (!fotosUrls.includes(url)) {
      fotosUrls.push(url);
    }
  }

  return {
    ok: true,
    fotos: {
      fotoFachadaUrl: fotosUrls[0] ?? "",
      fotosUrls,
    },
  };
};

export type ResultadoValidacaoLocal =
  | {ok: true; dados: LocalPublicacao}
  | {ok: false; erro: string};

/** Mesmo contrato de `POST /locais`. A fila de sugestões reusa na homologação. */
export const validarPublicacaoLocal = (body: unknown): ResultadoValidacaoLocal => {
  if (!body || typeof body !== "object") {
    return {ok: false, erro: "nome é obrigatório"};
  }
  const bruto = body as Record<string, unknown>;

  const nome = typeof bruto.nome === "string" ? bruto.nome.trim() : "";
  if (nome.length < 3 || nome.length > 80) {
    return {ok: false, erro: "nome é obrigatório"};
  }

  const endereco = typeof bruto.endereco === "string" ? bruto.endereco.trim() : "";
  if (endereco.length < 3) {
    return {ok: false, erro: "endereco inválido"};
  }

  if (!isCoordLat(bruto.lat) || !isCoordLng(bruto.lng)) {
    return {ok: false, erro: "local inválido"};
  }
  if (!pontoEstaNoSul(bruto.lat, bruto.lng)) {
    return {ok: false, erro: ERRO_LOCALIZACAO_FORA_DO_SUL};
  }

  if (!isCategoria(bruto.categoria)) {
    return {ok: false, erro: "categoria inválida"};
  }

  const facilidades = parseFacilidades(bruto.facilidades);
  if (!facilidades) {
    return {ok: false, erro: "facilidades inválidas"};
  }

  if (typeof bruto.aberto24h !== "boolean") {
    return {ok: false, erro: "aberto24h inválido"};
  }

  const horarios = parseHorarios(bruto.aberto24h, bruto.horarios);
  if (!horarios) {
    return {ok: false, erro: "horario inválido"};
  }

  let linkMaps = "";
  if (bruto.linkMaps !== undefined && bruto.linkMaps !== null) {
    if (typeof bruto.linkMaps !== "string") {
      return {ok: false, erro: "linkMaps inválido"};
    }
    linkMaps = bruto.linkMaps.trim();
    if (linkMaps && !isUrlHttp(linkMaps)) {
      return {ok: false, erro: "linkMaps inválido"};
    }
  }

  const fotos = parseFotos(bruto);
  if (!fotos.ok) {
    return fotos;
  }

  return {
    ok: true,
    dados: {
      nome,
      endereco,
      lat: bruto.lat,
      lng: bruto.lng,
      categoria: bruto.categoria,
      facilidades,
      aberto24h: bruto.aberto24h,
      horarios,
      linkMaps,
      fotoFachadaUrl: fotos.fotos.fotoFachadaUrl,
      fotosUrls: fotos.fotos.fotosUrls,
    },
  };
};
