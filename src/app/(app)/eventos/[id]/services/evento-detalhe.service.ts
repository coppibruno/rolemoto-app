import { api } from "@/lib/api";
import type { AlbumEventoPublico, EventoDetalhe } from "@/types/evento";

export const eventoDetalheService = {
  buscar: (id: string) =>
    api<EventoDetalhe>(`/eventos/${encodeURIComponent(id)}`),

  excluir: (id: string) =>
    api<void>(`/eventos/${encodeURIComponent(id)}`, { method: "DELETE" }),

  ajustar: (
    id: string,
    dados: {
      titulo: string;
      informacoes: string;
      dataHoraAbertura: string;
      dataHoraEncerramento: string;
    },
  ) =>
    api<EventoDetalhe>(`/eventos/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),

  definirFotografo: (id: string, usuarioId: string) =>
    api<{ fotografoId: string }>(`/eventos/${encodeURIComponent(id)}/fotografo`, {
      method: "POST",
      body: JSON.stringify({ usuarioId }),
    }),

  removerFotografo: (id: string) =>
    api<void>(`/eventos/${encodeURIComponent(id)}/fotografo`, { method: "DELETE" }),

  adicionarAlbum: (id: string, url: string) =>
    api<{ album: AlbumEventoPublico; notificou: boolean }>(
      `/eventos/${encodeURIComponent(id)}/albuns`,
      {
        method: "POST",
        body: JSON.stringify({ url }),
      },
    ),

  removerAlbum: (id: string, albumId: string) =>
    api<void>(
      `/eventos/${encodeURIComponent(id)}/albuns/${encodeURIComponent(albumId)}`,
      { method: "DELETE" },
    ),
};
