import { api } from "@/lib/api";
import type {
  PublicacaoSerie,
  SerieEvento,
  SerieEventoCriada,
  SerieEventoDetalhe,
  SerieEventoResumo,
} from "@/types/serie-evento";

export const seriesEventoService = {
  listar: () => api<SerieEventoResumo[]>("/series-evento"),

  buscar: (id: string) => api<SerieEventoDetalhe>(`/series-evento/${id}`),

  criar: (dados: PublicacaoSerie) =>
    api<SerieEventoCriada>("/series-evento", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  atualizar: (id: string, dados: PublicacaoSerie) =>
    api<SerieEventoDetalhe>(`/series-evento/${id}`, {
      method: "PUT",
      body: JSON.stringify(dados),
    }),

  pausar: (id: string) =>
    api<SerieEventoDetalhe>(`/series-evento/${id}/pausar`, { method: "POST" }),

  retomar: (id: string) =>
    api<SerieEventoDetalhe>(`/series-evento/${id}/retomar`, { method: "POST" }),

  encerrar: (id: string) =>
    api<SerieEventoDetalhe>(`/series-evento/${id}/encerrar`, { method: "POST" }),

  pular: (id: string, ymd: string) =>
    api<SerieEvento>(`/series-evento/${id}/excecoes`, {
      method: "POST",
      body: JSON.stringify({ ymd }),
    }),
};
