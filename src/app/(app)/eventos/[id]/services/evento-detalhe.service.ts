import { api } from "@/lib/api";
import type { EventoDetalhe } from "@/types/evento";

export const eventoDetalheService = {
  buscar: (id: string) => api<EventoDetalhe>(`/eventos/${id}`),

  ajustar: (
    id: string,
    dados: {
      titulo: string;
      informacoes: string;
      dataHoraAbertura: string;
      dataHoraEncerramento: string;
    },
  ) =>
    api<EventoDetalhe>(`/eventos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),
};
