import { api } from "@/lib/api";
import type {
  NaoLidasNotificacoes,
  PaginaNotificacoes,
} from "@/types/notificacao";

export const notificacoesService = {
  listar: (cursor: string | null = null) => {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return api<PaginaNotificacoes>(`/notificacoes${q}`);
  },
  naoLidas: () => api<NaoLidasNotificacoes>("/notificacoes/nao-lidas"),
  marcarLida: (id: string) => api<void>(`/notificacoes/${id}/lida`, { method: "POST" }),
  marcarTodas: () => api<void>("/notificacoes/lidas", { method: "POST" }),
};
