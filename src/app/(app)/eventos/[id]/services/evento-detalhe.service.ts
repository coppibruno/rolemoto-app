import { api } from "@/lib/api";
import type { EventoDetalhe } from "@/types/evento";

export const eventoDetalheService = {
  buscar: (id: string) => api<EventoDetalhe>(`/eventos/${id}`),
};
