import type { RitmoRole } from "./role";

export type StatusMeuRole = "pendente" | "confirmado" | "lider" | "concluido" | "recusado";

export type AbaMeusRoles = "proximos" | "confirmados" | "aguardando" | "concluidos" | "recusados";

export type PapelMeuRole = "participante" | "organizador";

export type CriadorMeuRole = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

export type DestaqueParticipante = {
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
  ativos: number;
  analise: number;
  asfaltoKm: number;
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
  contagens: ContagensMeusRoles;
};

export type FiltrosMeusRoles = {
  aba: AbaMeusRoles;
  ritmo: RitmoRole | "todas";
  papel: PapelMeuRole | "todos";
};
