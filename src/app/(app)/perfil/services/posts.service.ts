import { api } from "@/lib/api";
import type {
  ComentarioPost,
  DetalhePost,
  ItemGradePost,
  NovoPost,
  PaginaPost,
  RespostaNovoPost,
} from "@/types/post-foto";

const comCursor = (caminho: string, cursor: string | null) =>
  cursor ? `${caminho}?cursor=${encodeURIComponent(cursor)}` : caminho;

const doPost = (id: string) => `/posts/${encodeURIComponent(id)}`;

export const postsService = {
  grade: (uid: string, cursor: string | null) =>
    api<PaginaPost<ItemGradePost>>(comCursor(`/usuarios/${encodeURIComponent(uid)}/posts`, cursor)),

  detalhe: (id: string) => api<DetalhePost>(doPost(id)),

  publicar: (dados: NovoPost) =>
    api<RespostaNovoPost>("/posts", { method: "POST", body: JSON.stringify(dados) }),

  apagar: (id: string) => api<void>(doPost(id), { method: "DELETE" }),

  comentarios: (id: string, cursor: string | null) =>
    api<PaginaPost<ComentarioPost>>(comCursor(`${doPost(id)}/comentarios`, cursor)),

  comentar: (id: string, texto: string) =>
    api<ComentarioPost>(`${doPost(id)}/comentarios`, {
      method: "POST",
      body: JSON.stringify({ texto }),
    }),

  apagarComentario: (id: string, comentarioId: string) =>
    api<void>(`${doPost(id)}/comentarios/${encodeURIComponent(comentarioId)}`, {
      method: "DELETE",
    }),

  encaminhar: (id: string) =>
    api<{ storyId: string }>(`${doPost(id)}/story`, { method: "POST" }),
};
