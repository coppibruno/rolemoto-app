export type TipoAlvoAvaliacao = "local" | "evento";

export type NotaAvaliacao = 1 | 2 | 3 | 4 | 5;

export type AutorAvaliacao = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

/** Documento de feedback (resposta da API com autor). */
export type AvaliacaoExperiencia = {
  id: string;
  usuarioId: string;
  alvoTipo: TipoAlvoAvaliacao;
  alvoId: string;
  nota: NotaAvaliacao;
  comentario: string;
  fotosUrls: string[];
  recomendaComboio: boolean;
  createdAt: string;
  updatedAt: string;
  autor: AutorAvaliacao;
};

export type AvaliacaoCreate = {
  nota: NotaAvaliacao;
  comentario: string;
  fotosUrls: string[];
  recomendaComboio: boolean;
};

/** Enriquecimento no feed / detalhe. */
export type ResumoAvaliacoesAlvo = {
  notaMedia: number;
  totalAvaliacoes: number;
  recomendacoesComboio: number;
};
