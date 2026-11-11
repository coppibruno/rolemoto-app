export type TipoMarcaPost = "local" | "evento";

export type MarcaPost = {
  tipo: TipoMarcaPost;
  id: string;
  nome: string;
};

export type AutorPost = {
  uid: string;
  apelido: string;
  fotoUrl: string;
};

export type ItemGradePost = {
  id: string;
  fotoUrl: string;
  createdAt: string;
};

export type DetalhePost = {
  id: string;
  fotoUrl: string;
  legenda: string;
  marca: MarcaPost | null;
  totalComentarios: number;
  createdAt: string;
  encaminhadoPorMim: boolean;
  autor: AutorPost;
};

export type ComentarioPost = {
  id: string;
  texto: string;
  createdAt: string;
  podeApagar: boolean;
  autor: AutorPost;
};

export type PaginaPost<T> = {
  itens: T[];
  proximoCursor: string | null;
};

export type NovoPost = {
  fotoUrl: string;
  legenda?: string;
  marca?: { tipo: TipoMarcaPost; id: string } | null;
  encaminharStory?: boolean;
};

export type RespostaNovoPost = {
  post: DetalhePost;
  story: { id: string } | null;
  erroStory: string | null;
};

export const LIMITE_LEGENDA = 500;
export const LIMITE_COMENTARIO = 280;

export const hrefPost = (autorUid: string, postId: string): string =>
  `/perfil/${encodeURIComponent(autorUid)}/fotos/${encodeURIComponent(postId)}`;
