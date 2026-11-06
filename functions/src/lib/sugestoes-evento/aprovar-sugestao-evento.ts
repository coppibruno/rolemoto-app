import type {AcessoEvento} from "../../types/evento";
import type {Localizacao} from "../../types/role";
import {
  ERRO_LOCALIZACAO_FORA_DO_SUL,
  pontoEstaNoSul,
} from "../regiao-sul";
import type {
  FonteSugestaoEvento,
  LocalSugestaoEvento,
} from "../../types/sugestao-evento";

type Origem = {
  fonte: FonteSugestaoEvento;
  local: LocalSugestaoEvento;
  linkIngresso: string | null;
  urlOrigem: string;
};

const linkValido = (valor: string): boolean => {
  if (!valor || valor.length > 2000) {
    return false;
  }
  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const pinSalvo = (local: LocalSugestaoEvento): Localizacao | null => {
  if (local.lat == null || local.lng == null) {
    return null;
  }
  if (!pontoEstaNoSul(local.lat, local.lng) || local.endereco.trim().length < 3) {
    return null;
  }
  return {
    lat: local.lat,
    lng: local.lng,
    endereco: local.endereco.trim(),
    nome: local.nome.trim(),
  };
};

const localInformado = (valor: unknown): Localizacao | null => {
  if (!valor || typeof valor !== "object") {
    return null;
  }
  const objeto = valor as Record<string, unknown>;
  const lat = objeto.lat;
  const lng = objeto.lng;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return null;
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return null;
  }
  if (typeof objeto.endereco !== "string" || objeto.endereco.trim().length < 3) {
    return null;
  }
  if (
    objeto.nome !== undefined &&
    objeto.nome !== null &&
    typeof objeto.nome !== "string"
  ) {
    return null;
  }
  return {
    lat,
    lng,
    endereco: objeto.endereco.trim().slice(0, 300),
    nome: typeof objeto.nome === "string" ? objeto.nome.trim().slice(0, 120) : "",
  };
};

/** MotoClub usa o pin gravado. Instagram sem pin no Sul exige o ponto do admin. */
export const resolverLocalAprovacao = (
  sugestao: Pick<Origem, "fonte" | "local">,
  bruto: unknown,
): {ok: true; local: Localizacao} | {ok: false; erro: string} => {
  const salvo = pinSalvo(sugestao.local);
  if (sugestao.fonte !== "instagram") {
    if (!salvo) {
      return {ok: false, erro: ERRO_LOCALIZACAO_FORA_DO_SUL};
    }
    return {ok: true, local: salvo};
  }
  if (salvo) {
    return {ok: true, local: salvo};
  }
  const corpo = bruto && typeof bruto === "object" ?
    (bruto as Record<string, unknown>).local :
    undefined;
  const informado = localInformado(corpo);
  if (!informado) {
    return {ok: false, erro: "local inválido"};
  }
  if (!pontoEstaNoSul(informado.lat, informado.lng)) {
    return {ok: false, erro: ERRO_LOCALIZACAO_FORA_DO_SUL};
  }
  return {ok: true, local: informado};
};

/**
 * Ingresso do Instagram só vale com URL no documento ou no corpo.
 * A URL do post não substitui o ingresso.
 */
export const resolverLinkAprovacao = (
  sugestao: Pick<Origem, "fonte" | "linkIngresso" | "urlOrigem">,
  acesso: AcessoEvento,
  bruto: unknown,
): {ok: true; linkIngresso: string | null} | {ok: false; erro: string} => {
  if (acesso !== "ingresso") {
    return {ok: true, linkIngresso: null};
  }
  if (sugestao.fonte !== "instagram") {
    const link = sugestao.linkIngresso || sugestao.urlOrigem;
    if (!linkValido(link)) {
      return {ok: false, erro: "linkIngresso é obrigatório"};
    }
    return {ok: true, linkIngresso: link};
  }
  const gravado = sugestao.linkIngresso && linkValido(sugestao.linkIngresso) ?
    sugestao.linkIngresso :
    "";
  if (gravado) {
    return {ok: true, linkIngresso: gravado};
  }
  const corpo = bruto && typeof bruto === "object" ?
    (bruto as Record<string, unknown>).linkIngresso :
    undefined;
  const informado = typeof corpo === "string" ? corpo.trim() : "";
  if (!linkValido(informado)) {
    return {ok: false, erro: "linkIngresso é obrigatório"};
  }
  return {ok: true, linkIngresso: informado};
};
