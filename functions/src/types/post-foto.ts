export const LIMITE_PAGINA_POSTS = 30;
export const LIMITE_PAGINA_COMENTARIOS = 30;

export type TipoMarcaPost = "local" | "evento";

export interface MarcaPost {
  tipo: TipoMarcaPost;
  id: string;
}

export interface PostFoto {
  id: string;
  usuarioId: string;
  fotoUrl: string;
  storagePath: string;
  legenda: string;
  marcaTipo: TipoMarcaPost | null;
  marcaId: string | null;
  totalComentarios: number;
  createdAt: string;
}

export type PostFotoCreate = Omit<PostFoto, "id" | "createdAt" | "totalComentarios">;

export interface ComentarioPost {
  id: string;
  postId: string;
  usuarioId: string;
  texto: string;
  createdAt: string;
}

export type ComentarioPostCreate = Omit<ComentarioPost, "id" | "createdAt">;

export interface AutorPost {
  uid: string;
  apelido: string;
  fotoUrl: string;
}

export interface ItemGradePost {
  id: string;
  fotoUrl: string;
  createdAt: string;
}

export interface DetalhePost {
  id: string;
  fotoUrl: string;
  legenda: string;
  marca: {tipo: TipoMarcaPost; id: string; nome: string} | null;
  totalComentarios: number;
  createdAt: string;
  encaminhadoPorMim: boolean;
  autor: AutorPost;
}

export interface ComentarioPublico {
  id: string;
  texto: string;
  createdAt: string;
  podeApagar: boolean;
  autor: AutorPost;
}

export type Pagina<T> =
  | {ok: true; itens: T[]; proximoCursor: string | null}
  | {ok: false};

export type ResultadoComentar =
  | {tipo: "criado"; comentario: ComentarioPost}
  | {tipo: "post_ausente"};
