/** Resumo de piloto para pilha de avatares / lista completa. */
export type ParticipanteResumo = {
  uid: string;
  apelido: string;
  fotoUrl: string;
  iniciais: string;
  moto: string;
};

export type ParticipantesBloco = {
  total: number;
  destaques: ParticipanteResumo[];
};

export type ParticipantesLista = {
  total: number;
  itens: ParticipanteResumo[];
};

export const LIMITE_DESTAQUES_FEED = 3;
export const LIMITE_LISTA_PARTICIPANTES = 200;
