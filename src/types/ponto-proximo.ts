import type { AlvoPlayer, AlvoPostagem } from "./story-local";

export type PontoProximo = {
  tipo: "local" | "evento";
  id: string;
  localId: string | null;
  eventoId: string | null;
  nome: string;
  fotoUrl: string;
  checkinProprio: boolean;
};

export const alvoPostagemPonto = (ponto: PontoProximo): AlvoPostagem =>
  ponto.tipo === "local"
    ? { tipo: "local", id: ponto.id }
    : { tipo: "evento", id: ponto.id, localId: ponto.localId };

export const alvoPlayerPonto = (ponto: PontoProximo): AlvoPlayer =>
  ponto.tipo === "local" || ponto.localId
    ? { tipo: "local", id: ponto.localId ?? ponto.id }
    : { tipo: "evento", id: ponto.id };
