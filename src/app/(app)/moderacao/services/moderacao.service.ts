import { api } from "@/lib/api";
import type {
  AlvoDenuncia,
  MotivoDenuncia,
  PaginaBloqueios,
  RespostaBloqueio,
  RespostaDenuncia,
} from "@/types/moderacao";

export const moderacaoService = {
  bloquear: (uid: string) =>
    api<RespostaBloqueio>(`/usuarios/${encodeURIComponent(uid)}/bloqueio`, {
      method: "POST",
    }),

  desbloquear: (uid: string) =>
    api<RespostaBloqueio>(`/usuarios/${encodeURIComponent(uid)}/bloqueio`, {
      method: "DELETE",
    }),

  listar: (cursor: string | null = null) => {
    const caminho = cursor
      ? `/bloqueios?cursor=${encodeURIComponent(cursor)}`
      : "/bloqueios";
    return api<PaginaBloqueios>(caminho);
  },

  denunciar: (dados: {
    alvoTipo: AlvoDenuncia;
    alvoId: string;
    motivo: MotivoDenuncia;
    detalhes?: string;
  }) =>
    api<RespostaDenuncia>("/denuncias", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
