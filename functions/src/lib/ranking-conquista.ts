import {apelidoExibicao} from "./apelido";
import {TETO_RODA_RANKING} from "../types/conquista";
import type {ItemRanking, UsuarioConquista} from "../types/conquista";

export type PessoaRanking = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

export type EntradaRanking = {
  tokenUid: string;
  carimbos: UsuarioConquista[];
  pessoas: PessoaRanking[];
};

const umaCasa = (n: number): number => Math.round(n * 10) / 10;

/** Seguidos já em `createdAt` desc; o próprio uid não ocupa vaga no teto. */
export const cortarRoda = (tokenUid: string, seguidos: string[]): string[] => {
  const roda: string[] = [];
  const vistos = new Set<string>([tokenUid]);
  for (const uid of seguidos) {
    if (roda.length >= TETO_RODA_RANKING) break;
    if (!uid || vistos.has(uid)) continue;
    vistos.add(uid);
    roda.push(uid);
  }
  return [tokenUid, ...roda];
};

/**
 * Placar da SPEC 058 §7.1: velocidade desc, `recordeEm` asc, uid asc.
 * Seguido sem `users` sai. O token sem carimbo fecha a lista sem posição.
 */
export const montarRanking = ({
  tokenUid,
  carimbos,
  pessoas,
}: EntradaRanking): ItemRanking[] => {
  const porUid = new Map(pessoas.map((p) => [p.uid, p]));
  const comCarimbo = carimbos
    .filter((c) => c.usuarioId === tokenUid || porUid.has(c.usuarioId))
    .map((c) => ({...c, velocidadeMaxKmh: umaCasa(c.velocidadeMaxKmh)}))
    .sort((a, b) => {
      if (a.velocidadeMaxKmh !== b.velocidadeMaxKmh) {
        return b.velocidadeMaxKmh - a.velocidadeMaxKmh;
      }
      const tempo = Date.parse(a.recordeEm) - Date.parse(b.recordeEm);
      if (tempo !== 0 && Number.isFinite(tempo)) return tempo;
      if (a.usuarioId === b.usuarioId) return 0;
      return a.usuarioId < b.usuarioId ? -1 : 1;
    });

  const linha = (uid: string): Omit<ItemRanking, "posicao" | "velocidadeMaxKmh"> => {
    const pessoa = porUid.get(uid);
    return {
      uid,
      apelido: apelidoExibicao(pessoa),
      fotoUrl: pessoa?.fotoUrl ?? "",
      eu: uid === tokenUid,
    };
  };

  const itens: ItemRanking[] = comCarimbo.map((c, i) => ({
    posicao: i + 1,
    ...linha(c.usuarioId),
    velocidadeMaxKmh: c.velocidadeMaxKmh,
  }));

  if (!comCarimbo.some((c) => c.usuarioId === tokenUid)) {
    itens.push({posicao: null, ...linha(tokenUid), velocidadeMaxKmh: null});
  }
  return itens;
};
