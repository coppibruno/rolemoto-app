import { api } from "@/lib/api";
import type {
  ComentarioAtividade,
  ItemAtividade,
  PaginaComentariosAtividade,
  PaginaFeedAmigos,
  RespostaCurtida,
} from "@/types/atividade";

const comQuery = (caminho: string, chave: string, valor: string | null) =>
  valor ? `${caminho}?${chave}=${encodeURIComponent(valor)}` : caminho;

const daAtividade = (id: string) => `/atividades/${encodeURIComponent(id)}`;

export const inicioService = {
  pagina: (cursor: string | null) =>
    api<PaginaFeedAmigos>(comQuery("/feed/amigos", "cursor", cursor)),

  novidades: (desde: string) =>
    api<{ total: number }>(comQuery("/feed/amigos/novidades", "desde", desde)),

  item: (id: string) => api<ItemAtividade>(daAtividade(id)),

  curtir: (id: string) =>
    api<RespostaCurtida>(`${daAtividade(id)}/curtida`, { method: "POST" }),

  descurtir: (id: string) =>
    api<RespostaCurtida>(`${daAtividade(id)}/curtida`, { method: "DELETE" }),

  comentarios: (id: string, cursor: string | null) =>
    api<PaginaComentariosAtividade>(comQuery(`${daAtividade(id)}/comentarios`, "cursor", cursor)),

  comentar: (id: string, texto: string) =>
    api<ComentarioAtividade>(`${daAtividade(id)}/comentarios`, {
      method: "POST",
      body: JSON.stringify({ texto }),
    }),

  apagarComentario: (id: string, comentarioId: string) =>
    api<void>(`${daAtividade(id)}/comentarios/${encodeURIComponent(comentarioId)}`, {
      method: "DELETE",
    }),
};
