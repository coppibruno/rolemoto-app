import type {ParticipantesBloco} from "./participante";
import type {UsuarioRole} from "./usuario-role";

export type RitmoRole = "tranquila" | "moderada" | "agressiva";

/** Aberto entra na hora; fechado passa pela fila do líder. */
export type AcessoRole = "aberto" | "fechado";

export const TETO_ROLES_FIXADOS = 12;

export interface Localizacao {
  lat: number;
  lng: number;
  endereco: string;
  /** Apelido curto do ponto. Vazio = UI usa só o endereço. */
  nome: string;
}

/** Rolê de moto — sem tipos do Firebase. Datas em ISO. */
export interface Role {
  id: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  dataHoraSaida: string;
  localSaida: Localizacao;
  /** Na ordem da viagem, entre a saída e o destino. Doc antigo lê `[]`. */
  paradas: Localizacao[];
  destinoFinal: Localizacao;
  /** Doc antigo sem o campo lê `fechado`. Só muda na criação. */
  acesso: AcessoRole;
  /** Na faixa Rotas do perfil do criador. Ausente lê `false`. */
  fixado: boolean;
  criadorId: string;
  createdAt: string;
  updatedAt: string;
}

/** Faixa Rotas — `GET /perfil` e `GET /usuarios/:uid`. */
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
  seguidoPorMim: boolean;
};

/** Item do feed — km até a saída + comprimento da rota + organizador. Sem o array de paradas. */
export type RoleFeedItem = Omit<Role, "paradas"> & {
  totalParadas: number;
  distanciaPartidaKm: number;
  distanciaRotaKm: number;
  criador: RoleCriadorResumo;
  participantes: ParticipantesBloco;
};

/** Detalhe do rolê — GET /roles/:id. */
export type RoleDetalhe = Role & {
  criador: RoleCriadorResumo;
  distanciaKm: number;
  participantes: {confirmados: number};
  minhaParticipacao: UsuarioRole | null;
};

/** Campos que o PUT pode trocar — `acesso` e `fixado` ficam de fora. */
export type RolePublicacao = Omit<
  Role,
  "id" | "criadorId" | "createdAt" | "updatedAt" | "acesso" | "fixado"
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

export type RoleCreate = RolePublicacao & {criadorId: string; acesso: AcessoRole};
export type RoleUpdate = Partial<RolePublicacao>;
