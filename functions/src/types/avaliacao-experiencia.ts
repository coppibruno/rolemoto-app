export type TipoAlvoAvaliacao = "local" | "evento";

export type AutorAvaliacao = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

export interface AvaliacaoExperiencia {
  id: string;
  usuarioId: string;
  alvoTipo: TipoAlvoAvaliacao;
  alvoId: string;
  nota: number;
  comentario: string;
  fotosUrls: string[];
  recomendaComboio: boolean;
  createdAt: string;
  updatedAt: string;
  autor: AutorAvaliacao;
}

/** Documento persistido em `userslocalfeedback` — sem autor/alvoTipo. */
export type UsuarioLocalFeedbackDoc = {
  id: string;
  usuarioId: string;
  localId: string;
  nota: number;
  comentario: string;
  fotosUrls: string[];
  recomendaComboio: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Documento persistido em `userseventofeedback` — sem autor/alvoTipo. */
export type UsuarioEventoFeedbackDoc = {
  id: string;
  usuarioId: string;
  eventoId: string;
  nota: number;
  comentario: string;
  fotosUrls: string[];
  recomendaComboio: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AvaliacaoExperienciaCreate = {
  usuarioId: string;
  alvoId: string;
  nota: number;
  comentario: string;
  fotosUrls: string[];
  recomendaComboio: boolean;
};

export type ResumoAvaliacoesAlvo = {
  notaMedia: number;
  totalAvaliacoes: number;
  recomendacoesComboio: number;
};
