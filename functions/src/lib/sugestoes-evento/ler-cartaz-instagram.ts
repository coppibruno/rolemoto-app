import type {AcessoEvento, TipoEvento} from "../../types/evento";
import {encerramentoValido, instanteDoJsonLd} from "./datas-evento";
import {tituloCurto} from "./texto-sugestao-evento";

const TIPOS: TipoEvento[] = [
  "moto_point_semanal",
  "track_day",
  "cafe_pilotos",
  "exposicao_custom",
];

const MOTIVO_SETE_DIAS = "encerramento limitado a 7 dias";
const UFS_SUL = new Set(["SC", "PR", "RS"]);
const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

export type CartazInstagram = {
  titulo: string;
  abertura: string;
  encerramento: string | null;
  tipo: TipoEvento;
  acesso: AcessoEvento;
  linkIngresso: string | null;
  lugar: string;
  cidade: string;
  /** `SC`, `PR` ou `RS`; `""` quando o post não diz o estado. */
  uf: string;
  motivos: string[];
  nota: 50;
};

export type OpcoesCartaz = {
  agora: Date;
  legenda: string;
};

const jsonDeTexto = (texto: string): unknown => {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(limpo);
  } catch {
    return null;
  }
};

const textoDe = (valor: unknown, teto: number): string => {
  if (typeof valor !== "string") {
    return "";
  }
  return valor.replace(/\s+/g, " ").trim().slice(0, teto);
};

const hostDe = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

/** URL http(s) da legenda. O permalink e o "link na bio" não viram ingresso. */
export const linkDaLegenda = (legenda: string): string | null => {
  const encontradas = legenda.match(URL_RE) ?? [];
  for (const bruta of encontradas) {
    const url = bruta.replace(/[.,;]+$/, "");
    const host = hostDe(url);
    if (!host || host === "instagram.com" || host === "instagr.am") {
      continue;
    }
    return url.slice(0, 2000);
  }
  return null;
};

const aberturaDe = (valor: unknown): string | null => {
  if (typeof valor !== "string" || !valor.trim()) {
    return null;
  }
  const texto = valor.trim();
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(texto)) {
    const ms = Date.parse(texto);
    if (Number.isNaN(ms)) {
      return null;
    }
    return new Date(ms).toISOString();
  }
  return instanteDoJsonLd(texto, "12:00");
};

const ufDe = (valor: unknown): string => {
  if (typeof valor !== "string") {
    return "";
  }
  const uf = valor.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(uf) ? uf : "";
};

const tipoDe = (valor: unknown): TipoEvento => {
  if (valor === "moto_point") {
    return "moto_point_semanal";
  }
  if (typeof valor === "string" && (TIPOS as string[]).includes(valor)) {
    return valor as TipoEvento;
  }
  return "moto_point_semanal";
};

const motivosDe = (valor: unknown, limitado: boolean): string[] => {
  const lista = Array.isArray(valor) ?
    valor.filter((item): item is string => typeof item === "string") :
    [];
  const motivos = lista
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 3);
  if (!limitado || motivos.includes(MOTIVO_SETE_DIAS)) {
    return motivos;
  }
  if (motivos.length >= 3) {
    motivos[2] = MOTIVO_SETE_DIAS;
    return motivos;
  }
  motivos.push(MOTIVO_SETE_DIAS);
  return motivos;
};

/**
 * Lê o JSON do cartaz e descarta o que não é encontro futuro.
 * Sem rede: a chamada ao modelo fica fora daqui.
 */
export const lerCartazInstagram = (
  entrada: unknown,
  opcoes: OpcoesCartaz,
): CartazInstagram | null => {
  const bruto = typeof entrada === "string" ? jsonDeTexto(entrada) : entrada;
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) {
    return null;
  }
  const dados = bruto as Record<string, unknown>;
  if (dados.eEvento !== true) {
    return null;
  }
  const titulo = tituloCurto(textoDe(dados.titulo, 120));
  if (!titulo) {
    return null;
  }
  const uf = ufDe(dados.uf);
  if (uf && !UFS_SUL.has(uf)) {
    return null;
  }
  const abertura = aberturaDe(dados.abertura);
  if (!abertura || Date.parse(abertura) <= opcoes.agora.getTime()) {
    return null;
  }
  const fimBruto = aberturaDe(dados.encerramento);
  const fim = encerramentoValido(abertura, fimBruto);
  const acesso: AcessoEvento = dados.acesso === "ingresso" ? "ingresso" : "gratis";
  const link = acesso === "ingresso" ? linkDaLegenda(opcoes.legenda) : null;
  return {
    titulo,
    abertura,
    encerramento: fim.iso,
    tipo: tipoDe(dados.tipo),
    acesso,
    linkIngresso: link,
    lugar: textoDe(dados.lugar, 300),
    cidade: textoDe(dados.cidade, 120),
    uf,
    motivos: motivosDe(dados.motivos, fim.limitado),
    nota: 50,
  };
};
