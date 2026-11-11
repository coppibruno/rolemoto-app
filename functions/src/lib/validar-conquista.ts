import {pontoEstaNoSul} from "./regiao-sul";
import type {
  Conquista,
  ConquistaAdmin,
  ConquistaCatalogo,
  ConquistaDados,
  ConquistaUpdate,
} from "../types/conquista";

export const NOME_MIN = 3;
export const NOME_MAX = 48;
export const RAIO_MIN_M = 150;
export const RAIO_MAX_M = 2000;
export const RAIO_PASSO_M = 50;

export const ERRO_NOME = `nome deve ter de ${NOME_MIN} a ${NOME_MAX} caracteres`;
export const ERRO_RAIO =
  `raioMetros deve ir de ${RAIO_MIN_M} a ${RAIO_MAX_M}, de ${RAIO_PASSO_M} em ${RAIO_PASSO_M}`;
export const ERRO_FORA_DO_SUL = "Só cadastramos pontos em SC, PR e RS";
export const ERRO_NOME_REPETIDO = "Já existe uma conquista com esse nome";

type Validado<T> = {ok: true; dados: T} | {ok: false; erro: string};

const MARCAS = /[\u0300-\u036f]/g;

/** Sem acento, minúsculas e um espaço: base da unicidade e da ordem. */
export const nomeNormalizado = (nome: string): string =>
  nome.trim().replace(/\s+/g, " ").toLowerCase().normalize("NFD").replace(MARCAS, "");

const lerNome = (valor: unknown): string | null => {
  if (typeof valor !== "string") return null;
  const nome = valor.trim().replace(/\s+/g, " ");
  return nome.length >= NOME_MIN && nome.length <= NOME_MAX ? nome : null;
};

const isNumero = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor);

const raioValido = (valor: unknown): valor is number =>
  isNumero(valor) &&
  Number.isInteger(valor) &&
  valor >= RAIO_MIN_M &&
  valor <= RAIO_MAX_M &&
  valor % RAIO_PASSO_M === 0;

const validarCoordenada = (
  campo: "lat" | "lng",
  valor: unknown,
): string | null => {
  const limite = campo === "lat" ? 90 : 180;
  if (!isNumero(valor) || Math.abs(valor) > limite) {
    return `${campo} inválida`;
  }
  return null;
};

export const validarConquistaCriacao = (body: unknown): Validado<ConquistaDados> => {
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const nome = lerNome(o.nome);
  if (!nome) return {ok: false, erro: ERRO_NOME};
  const erroCoord = validarCoordenada("lat", o.lat) ?? validarCoordenada("lng", o.lng);
  if (erroCoord) return {ok: false, erro: erroCoord};
  if (!raioValido(o.raioMetros)) return {ok: false, erro: ERRO_RAIO};
  const lat = o.lat as number;
  const lng = o.lng as number;
  if (!pontoEstaNoSul(lat, lng)) return {ok: false, erro: ERRO_FORA_DO_SUL};
  return {ok: true, dados: {nome, lat, lng, raioMetros: o.raioMetros}};
};

/**
 * Body parcial do `PATCH`. O pino final (com o doc atual) é conferido
 * em `pinoFinalNoSul`, porque lat e lng podem vir separados.
 */
export const validarConquistaPatch = (body: unknown): Validado<ConquistaUpdate> => {
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const dados: ConquistaUpdate = {};
  if (o.nome !== undefined) {
    const nome = lerNome(o.nome);
    if (!nome) return {ok: false, erro: ERRO_NOME};
    dados.nome = nome;
  }
  for (const campo of ["lat", "lng"] as const) {
    if (o[campo] === undefined) continue;
    const erro = validarCoordenada(campo, o[campo]);
    if (erro) return {ok: false, erro};
    dados[campo] = o[campo] as number;
  }
  if (o.raioMetros !== undefined) {
    if (!raioValido(o.raioMetros)) return {ok: false, erro: ERRO_RAIO};
    dados.raioMetros = o.raioMetros;
  }
  if (o.ativa !== undefined) {
    if (typeof o.ativa !== "boolean") return {ok: false, erro: "ativa inválida"};
    dados.ativa = o.ativa;
  }
  if (Object.keys(dados).length === 0) {
    return {ok: false, erro: "Nada para atualizar"};
  }
  return {ok: true, dados};
};

export const pinoFinalNoSul = (atual: Conquista, patch: ConquistaUpdate): boolean =>
  pontoEstaNoSul(patch.lat ?? atual.lat, patch.lng ?? atual.lng);

/** Outro doc (arquivado ou não) já usa o nome normalizado. */
export const nomeEmUso = (
  catalogo: Conquista[],
  nome: string,
  ignorarId?: string,
): boolean => {
  const alvo = nomeNormalizado(nome);
  return catalogo.some((c) => c.id !== ignorarId && nomeNormalizado(c.nome) === alvo);
};

export const ordenarPorNome = <T extends {nome: string}>(itens: T[]): T[] =>
  [...itens].sort((a, b) => {
    const na = nomeNormalizado(a.nome);
    const nb = nomeNormalizado(b.nome);
    if (na < nb) return -1;
    return na > nb ? 1 : 0;
  });

export const paraCatalogo = (c: Conquista): ConquistaCatalogo => ({
  id: c.id,
  nome: c.nome,
  lat: c.lat,
  lng: c.lng,
  raioMetros: c.raioMetros,
});

export const paraAdmin = (c: Conquista): ConquistaAdmin => ({
  ...paraCatalogo(c),
  ativa: c.ativa,
});
