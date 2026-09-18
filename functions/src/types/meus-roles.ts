import type {RitmoRole} from "./role";
import type {TipoEvento} from "./evento";
import type {CategoriaLocal} from "./local";

export type StatusMeuRole = "pendente" | "confirmado" | "lider" | "concluido" | "recusado";

export type PapelMeuRole = "participante" | "organizador";

export type CriadorMeuRole = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

export type DestaqueParticipante = {
  uid: string;
  apelido: string;
  fotoUrl: string;
  iniciais: string;
};

export type MeuRoleItem = {
  roleId: string;
  titulo: string;
  descricao: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  dataHoraSaida: string;
  localSaidaEndereco: string;
  localSaidaNome: string;
  distanciaRotaKm: number;
  status: StatusMeuRole;
  papel: PapelMeuRole;
  criador: CriadorMeuRole;
  participantes: {
    confirmados: number;
    destaques: DestaqueParticipante[];
  };
  pedidoCriadoEm: string | null;
  recusadoEm: string | null;
};

export type TelemetriaMeusRoles = {
  rolesFeitos: number;
  eventosParticipados: number;
  locaisFavoritos: number;
};

export type ContagensTipoGaragem = {
  roles: number;
  eventos: number;
  locais: number;
};

export type ContagensMeusRoles = {
  confirmados: number;
  aguardando: number;
  concluidos: number;
  recusados: number;
};

export type MeusRolesPayload = {
  itens: MeuRoleItem[];
  telemetria: TelemetriaMeusRoles;
  contagensTipo: ContagensTipoGaragem;
  contagens: ContagensMeusRoles;
};

export type StatusMeuEventoGaragem = "confirmado" | "concluido";

export type MeuEventoGaragemItem = {
  eventoId: string;
  titulo: string;
  tipo: TipoEvento;
  fotoCapaUrl: string;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  localNome: string;
  localEndereco: string;
  status: StatusMeuEventoGaragem;
  inscritosTotal: number;
  avaliado: boolean;
  minhaAvaliacao: {
    nota: number;
    comentario: string;
    createdAt: string;
  } | null;
  notaMedia: number;
  totalAvaliacoes: number;
};

export type MeusEventosGaragemPayload = {
  itens: MeuEventoGaragemItem[];
};

export type MeuLocalGaragemItem = {
  localId: string;
  nome: string;
  categoria: CategoriaLocal;
  endereco: string;
  fotoFachadaUrl: string;
  facilidadesResumo: string;
  favoritadoEm: string;
  avaliado: boolean;
  minhaAvaliacao: {
    nota: number;
    comentario: string;
    fotosCount: number;
    createdAt: string;
  } | null;
  notaMedia: number;
  totalAvaliacoes: number;
};

export type MeusLocaisGaragemPayload = {
  itens: MeuLocalGaragemItem[];
};
