import type { Pilotagem } from "./user";
import type { UsuarioRole } from "./usuario-role";

export type { UsuarioRole } from "./usuario-role";

export interface Localizacao {
  lat: number;
  lng: number;
  endereco: string;
}

export type RitmoRole = Pilotagem;

export interface Role {
  id: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  dataHoraSaida: string;
  localSaida: Localizacao;
  destinoFinal: Localizacao;
  criadorId: string;
  createdAt: string;
  updatedAt: string;
}

export type RoleCriadorResumo = {
  uid: string;
  apelido: string;
  fotoUrl: string;
};

/** Item do feed — km até a saída + comprimento da rota + organizador. */
export type RoleFeedItem = Role & {
  distanciaPartidaKm: number;
  distanciaRotaKm: number;
  criador: RoleCriadorResumo;
};

export type RoleDetalhe = Role & {
  criador: RoleCriadorResumo;
  distanciaKm: number;
  participantes: { confirmados: number };
  minhaParticipacao: UsuarioRole | null;
};

export type RolePublicacao = Omit<
  Role,
  "id" | "criadorId" | "createdAt" | "updatedAt"
>;

/** DTO de clone — GET /roles/:id/modelo. Sem participação nem timestamps. */
export type RoleModelo = {
  roleIdOrigem: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  localSaida: Localizacao;
  destinoFinal: Localizacao;
  horaSaida: string;
};

export type RoleForm = RolePublicacao & { criadorId: string };
