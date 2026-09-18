import { api } from "@/lib/api";
import type { Evento, EventoPublicacao } from "@/types/evento";

export const eventosService = {
  criar: (dados: EventoPublicacao) =>
    api<Evento>("/eventos", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
