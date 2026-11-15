import type { MetaPacote, PontoNomeado } from "./tipos";

const numero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const pontoNomeado = (v: unknown): v is PontoNomeado => {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return typeof p.nome === "string" && numero(p.lat) && numero(p.lng);
};

const lista = (v: unknown): boolean => Array.isArray(v) && v.every(pontoNomeado);

/** `meta.json` que não abre ou não tem o formato vira `null`, como pacote ausente. */
export const lerMetaJson = (texto: string): MetaPacote | null => {
  let dado: unknown;
  try {
    dado = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!dado || typeof dado !== "object") return null;
  const meta = dado as Record<string, unknown>;
  if (typeof meta.pontosHash !== "string" || typeof meta.baixadoEm !== "string") return null;
  if (!Array.isArray(meta.pontos) || !lista(meta.postos) || !lista(meta.cidades)) return null;
  return dado as MetaPacote;
};
