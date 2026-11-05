import { api } from "@/lib/api";
import type { ResultadoConvite, SituacaoConvite } from "@/types/convite-evento";

export const conviteEventoService = {
  situacao: (eventoId: string, uids: string[]) =>
    api<SituacaoConvite>(`/eventos/${encodeURIComponent(eventoId)}/convites/situacao`, {
      method: "POST",
      body: JSON.stringify({ uids }),
    }),

  enviar: (eventoId: string, uids: string[]) =>
    api<ResultadoConvite>(`/eventos/${encodeURIComponent(eventoId)}/convites`, {
      method: "POST",
      body: JSON.stringify({ uids }),
    }),
};
