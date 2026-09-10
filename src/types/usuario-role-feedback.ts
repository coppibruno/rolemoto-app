export const TAGS_FEEDBACK = [
  "asfalto_tapete",
  "mirantes_incriveis",
  "pouco_trafego",
  "visual_cinematografico",
  "boas_curvas",
  "parada_bem_estruturada",
] as const;

export type TagFeedback = (typeof TAGS_FEEDBACK)[number];

export type NotaFeedback = 1 | 2 | 3 | 4 | 5;

export type AutorFeedback = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

export type UsuarioRoleFeedback = {
  id: string;
  usuarioId: string;
  roleId: string;
  nota: NotaFeedback;
  tags: TagFeedback[];
  comentario: string;
  createdAt: string;
  updatedAt: string;
  autor: AutorFeedback;
};

export type FeedbackPendente = {
  role: {
    id: string;
    titulo: string;
    dataHoraSaida: string;
  } | null;
};

export type FeedbackCreate = {
  nota: NotaFeedback;
  tags: TagFeedback[];
  comentario: string;
};
