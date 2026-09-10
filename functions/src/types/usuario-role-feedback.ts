export type TagFeedback =
  | "asfalto_tapete"
  | "mirantes_incriveis"
  | "pouco_trafego"
  | "visual_cinematografico"
  | "boas_curvas"
  | "parada_bem_estruturada";

export type AutorFeedback = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

export interface UsuarioRoleFeedback {
  id: string;
  usuarioId: string;
  roleId: string;
  nota: number;
  tags: TagFeedback[];
  comentario: string;
  createdAt: string;
  updatedAt: string;
  autor: AutorFeedback;
}

/** Documento persistido — sem `autor` (a rota hidrata). */
export type UsuarioRoleFeedbackDoc = Omit<UsuarioRoleFeedback, "autor">;

export type UsuarioRoleFeedbackCreate = {
  usuarioId: string;
  roleId: string;
  nota: number;
  tags: TagFeedback[];
  comentario: string;
};

export type FeedbackPendente = {
  role: {id: string; titulo: string; dataHoraSaida: string} | null;
};
