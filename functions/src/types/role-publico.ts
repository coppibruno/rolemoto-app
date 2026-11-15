import type {AcessoRole, Localizacao, RitmoRole} from "./role";

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

/** DTO sanitizado do convite — sem PII extra ou participação. */
export type RolePublico = {
  id: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  acesso: AcessoRole;
  dataHoraSaida: string;
  localSaidaEndereco: string;
  destinoFinalEndereco: string;
  localSaidaNome: string;
  destinoFinalNome: string;
  localSaidaLat: number;
  localSaidaLng: number;
  destinoFinalLat: number;
  destinoFinalLng: number;
  paradas: Localizacao[];
  distanciaKm: number;
  criador: CriadorPublico;
  participantes: {
    confirmados: number;
    destaques: ParticipanteDestaque[];
  };
};
