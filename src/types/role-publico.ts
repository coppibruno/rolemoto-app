import type { RitmoRole } from "./role";

export type CriadorPublico = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  moto: string;
};

export type ParticipanteDestaque = {
  iniciais: string;
  fotoUrl: string;
  moto: string;
};

export type RolePublico = {
  id: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  dataHoraSaida: string;
  localSaidaEndereco: string;
  destinoFinalEndereco: string;
  localSaidaNome: string;
  destinoFinalNome: string;
  localSaidaLat: number;
  localSaidaLng: number;
  destinoFinalLat: number;
  destinoFinalLng: number;
  distanciaKm: number;
  criador: CriadorPublico;
  participantes: {
    confirmados: number;
    destaques: ParticipanteDestaque[];
  };
};
