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

export type TipoAlvoParticipantes = "role" | "evento";
