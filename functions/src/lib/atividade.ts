import {codificarPolyline, decodificarPolyline} from "./tracado";
import {comentarioDe} from "./post-foto";
import {
  MAX_AUTORES_FEED,
  MAX_PONTOS_TRACADO_RESUMO,
  TAMANHO_LOTE_AUTORES,
} from "../types/atividade";
import type {TipoAtividade, TipoCompacto, TipoConteudo} from "../types/atividade";

const TIPOS_CONTEUDO: ReadonlySet<string> = new Set<TipoConteudo>([
  "foto",
  "telemetria",
  "role_criado",
  "role_realizado",
  "avaliacao_local",
  "avaliacao_evento",
]);

/** Só estes viram “Ana, Bruno e mais N…”. Selo fica individual. */
const TIPOS_AGRUPAVEIS: ReadonlySet<string> = new Set<TipoCompacto>([
  "entrada_role",
  "inscricao_evento",
]);

const JANELA_GRUPO_MS = 24 * 60 * 60 * 1000;

export const aceitaComentario = (tipo: TipoAtividade): boolean => TIPOS_CONTEUDO.has(tipo);

export const ehCompacto = (tipo: TipoAtividade): boolean => !aceitaComentario(tipo);

/** `foto_{postId}`, `entrada_role_{uid}_{roleId}`… Parte vazia ou com barra dá erro. */
export const idAtividade = (tipo: TipoAtividade, partes: string[]): string => {
  if (partes.length === 0 || partes.some((parte) => !parte || parte.includes("/"))) {
    throw new Error(`id de atividade inválido: ${tipo}`);
  }
  return `${tipo}_${partes.join("_")}`;
};

/** O token primeiro, sem repetir, no máximo 300 autores, em lotes de 30. */
export const lotesDeAutores = (tokenUid: string, seguidos: string[]): string[][] => {
  const unicos = [...new Set([tokenUid, ...seguidos].filter(Boolean))]
    .slice(0, MAX_AUTORES_FEED);
  const lotes: string[][] = [];
  for (let i = 0; i < unicos.length; i += TAMANHO_LOTE_AUTORES) {
    lotes.push(unicos.slice(i, i + TAMANHO_LOTE_AUTORES));
  }
  return lotes;
};

type Ordenavel = {id: string; createdAt: string};

const compararDesc = (a: Ordenavel, b: Ordenavel): number => {
  const porData = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  if (porData !== 0) return porData;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
};

/** Junta os lotes por `createdAt` desc e id desc, sem repetir, e corta em `limite`. */
export const mesclarPaginas = <T extends Ordenavel>(
  listas: T[][],
  limite: number,
): {itens: T[]; temMais: boolean} => {
  const porId = new Map<string, T>();
  for (const lista of listas) {
    for (const item of lista) {
      if (!porId.has(item.id)) porId.set(item.id, item);
    }
  }
  const ordenados = [...porId.values()].sort(compararDesc);
  return {itens: ordenados.slice(0, limite), temMais: ordenados.length > limite};
};

type Agrupavel = Ordenavel & {tipo: TipoAtividade; alvoId: string; autorId: string};

export type GrupoAtividade<T> = {
  principal: T;
  /** Autores distintos, do mais novo para o mais antigo. */
  autores: string[];
};

/**
 * Compacto com o mesmo tipo e alvo de um compacto anterior da página, até 24 h
 * antes dele, entra no grupo. O grupo fica na posição do mais novo.
 */
export const agruparCompactos = <T extends Agrupavel>(itens: T[]): GrupoAtividade<T>[] => {
  const grupos: GrupoAtividade<T>[] = [];
  const abertos = new Map<string, GrupoAtividade<T>>();
  for (const item of itens) {
    if (!TIPOS_AGRUPAVEIS.has(item.tipo)) {
      grupos.push({principal: item, autores: [item.autorId]});
      continue;
    }
    const chave = `${item.tipo}|${item.alvoId}`;
    const aberto = abertos.get(chave);
    const dentro = aberto &&
      Date.parse(aberto.principal.createdAt) - Date.parse(item.createdAt) <= JANELA_GRUPO_MS;
    if (aberto && dentro) {
      if (!aberto.autores.includes(item.autorId)) aberto.autores.push(item.autorId);
      continue;
    }
    const novo = {principal: item, autores: [item.autorId]};
    abertos.set(chave, novo);
    grupos.push(novo);
  }
  return grupos;
};

/** Primeiro e último ponto sempre; o resto em passo fixo até `maxPontos`. */
export const resumirTracado = (
  polyline: string,
  maxPontos = MAX_PONTOS_TRACADO_RESUMO,
): string => {
  const pontos = decodificarPolyline(polyline ?? "");
  if (pontos.length === 0) return "";
  const limite = Math.max(2, maxPontos);
  if (pontos.length <= limite) return codificarPolyline(pontos);
  const passo = (pontos.length - 1) / (limite - 1);
  const amostra = Array.from({length: limite}, (_, i) =>
    pontos[Math.min(pontos.length - 1, Math.round(i * passo))]);
  return codificarPolyline(amostra);
};

export const textoDoComentario = comentarioDe;
