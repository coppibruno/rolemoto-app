import type { ParticipantesBloco } from "./participante";
import type { Pilotagem } from "./user";
import type { UsuarioRole } from "./usuario-role";

export type { UsuarioRole } from "./usuario-role";

export interface Localizacao {
  lat: number;
  lng: number;
  endereco: string;
  /** Apelido curto do ponto. Vazio = UI usa só o endereço. */
  nome: string;
}

export type RitmoRole = Pilotagem;

/** Aberto entra na hora; fechado passa pela fila do líder. */
export type AcessoRole = "aberto" | "fechado";

export const TETO_ROLES_FIXADOS = 12;

export interface Role {
  id: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  dataHoraSaida: string;
  localSaida: Localizacao;
  /** Na ordem da viagem, entre a saída e o destino. */
  paradas: Localizacao[];
  destinoFinal: Localizacao;
  /** Doc antigo lê `fechado`. Só se escolhe na criação. */
  acesso: AcessoRole;
  fixado: boolean;
  criadorId: string;
  createdAt: string;
  updatedAt: string;
}

/** Faixa Rotas do perfil — `rolesFixados`. */
export type RoleFixadoResumo = {
  id: string;
  titulo: string;
  dataHoraSaida: string;
  fotoCapaUrl: string;
  acesso: AcessoRole;
};

export type RoleCriadorResumo = {
  uid: string;
  apelido: string;
  fotoUrl: string;
  seguidoPorMim?: boolean;
};

/** Item do feed — km até a saída + comprimento da rota + organizador. */
export type RoleFeedItem = Omit<Role, "paradas"> & {
  totalParadas: number;
  distanciaPartidaKm: number;
  distanciaRotaKm: number;
  criador: RoleCriadorResumo;
  participantes: ParticipantesBloco;
};

export type RoleDetalhe = Role & {
  criador: RoleCriadorResumo;
  distanciaKm: number;
  participantes: { confirmados: number };
  minhaParticipacao: UsuarioRole | null;
};

export type RolePublicacao = Omit<
  Role,
  "id" | "criadorId" | "createdAt" | "updatedAt" | "fixado"
>;

/** DTO de clone — GET /roles/:id/modelo. Sem participação nem timestamps. */
export type RoleModelo = {
  roleIdOrigem: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  localSaida: Localizacao;
  paradas: Localizacao[];
  destinoFinal: Localizacao;
  acesso: AcessoRole;
  horaSaida: string;
  /** ISO completo — clone ignora; edição pré-preenche data+hora */
  dataHoraSaida: string;
};

export type RoleForm = RolePublicacao & { criadorId: string };
