import { api } from "@/lib/api";
import type {
  AbaSeguir,
  PaginaPilotos,
  RespostaBuscaPilotos,
} from "@/types/seguir";

const caminhoLista = (uid: string, aba: AbaSeguir, cursor: string | null) => {
  const base = `/usuarios/${encodeURIComponent(uid)}/${aba}`;
  if (!cursor) return base;
  return `${base}?cursor=${encodeURIComponent(cursor)}`;
};

export const seguirService = {
  busca: (q: string) =>
    api<RespostaBuscaPilotos>(`/usuarios/busca?q=${encodeURIComponent(q)}`),

  seguir: (uid: string) =>
    api<{ seguido: boolean }>(`/usuarios/${encodeURIComponent(uid)}/seguir`, {
      method: "POST",
    }),

  deixar: (uid: string) =>
    api<{ seguido: boolean }>(`/usuarios/${encodeURIComponent(uid)}/seguir`, {
      method: "DELETE",
    }),

  listar: (uid: string, aba: AbaSeguir, cursor: string | null = null) =>
    api<PaginaPilotos>(caminhoLista(uid, aba, cursor)),
};
