import { api } from "@/lib/api";
import type {
  AbaSeguir,
  PaginaPilotos,
  RespostaBuscaPilotos,
  RespostaSugestoes,
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

  sugestoes: (lat?: number, lng?: number) => {
    const params = new URLSearchParams();
    if (lat !== undefined && lng !== undefined) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
    }
    const consulta = params.toString();
    const caminho = consulta ? `/usuarios/sugestoes?${consulta}` : "/usuarios/sugestoes";
    return api<RespostaSugestoes>(caminho);
  },

  dispensar: (uid: string) =>
    api<void>(`/usuarios/sugestoes/${encodeURIComponent(uid)}/dispensa`, {
      method: "POST",
    }),
};
