import type { LinhaSugestao } from "@/types/seguir";

const TTL_MS = 5 * 60 * 1000;

type Entrada = {
  em: number;
  itens: LinhaSugestao[];
};

const memoria = new Map<string, Entrada>();

export const chaveCacheSugestao = (lat: number | null, lng: number | null): string => {
  if (lat === null || lng === null) return "sem";
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
};

export const lerCacheSugestao = (chave: string, agora = Date.now()): LinhaSugestao[] | null => {
  const entrada = memoria.get(chave);
  if (!entrada) return null;
  if (agora - entrada.em > TTL_MS) {
    memoria.delete(chave);
    return null;
  }
  return [...entrada.itens];
};

export const guardarCacheSugestao = (
  chave: string,
  itens: LinhaSugestao[],
  agora = Date.now(),
) => {
  memoria.set(chave, { em: agora, itens: [...itens] });
};

export const tirarUidDoCache = (uid: string) => {
  for (const [chave, entrada] of memoria) {
    memoria.set(chave, {
      ...entrada,
      itens: entrada.itens.filter((item) => item.uid !== uid),
    });
  }
};

export const limparCacheSugestao = () => {
  memoria.clear();
};
