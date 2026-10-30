import { api } from "@/lib/api";
import type {
  AprovarSugestaoEvento,
  ResultadoBuscaEventos,
  SugestaoEvento,
} from "@/types/sugestao-evento";

export const sugestoesEventosService = {
  listar: () => api<{ itens: SugestaoEvento[] }>("/sugestoes-eventos"),

  buscar: () =>
    api<ResultadoBuscaEventos>("/sugestoes-eventos/buscar", {
      method: "POST",
    }),

  aprovar: (id: string, dados: AprovarSugestaoEvento) =>
    api<{ eventoId: string }>(`/sugestoes-eventos/${encodeURIComponent(id)}/aprovar`, {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  recusar: (id: string) =>
    api<void>(`/sugestoes-eventos/${encodeURIComponent(id)}/recusar`, {
      method: "POST",
    }),
};
