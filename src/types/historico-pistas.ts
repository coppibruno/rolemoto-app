import type { AcessoEvento } from "./evento";
import type { RitmoRole } from "./role";

export type AbaHistorico = "aguardando" | "participei" | "criados";

export type FiltroTipoHistorico = "todos" | "roles" | "eventos" | "telemetria";

export type StatusItemHistorico =
  | "pendente"
  | "confirmado"
  | "concluido"
  | "lider";

export type ItemHistoricoRole = {
  tipo: "role";
  roleId: string;
  titulo: string;
  descricao: string;
  dataHoraSaida: string;
  distanciaKm: number;
  participantesConfirmados: number;
  ritmo: RitmoRole;
  status: StatusItemHistorico;
};

export type ItemHistoricoEvento = {
  tipo: "evento";
  eventoId: string;
  titulo: string;
  dataHoraAbertura: string;
  localNome: string;
  acesso: AcessoEvento;
  inscritosConfirmados: number;
  status: "confirmado" | "concluido";
  avaliado?: boolean;
};

export type ItemHistoricoPista = ItemHistoricoRole | ItemHistoricoEvento;

export type HistoricoPistas = {
  aguardando: ItemHistoricoRole[];
  participei: ItemHistoricoPista[];
  criados: ItemHistoricoRole[];
  contagens: {
    aguardando: number;
    participei: number;
    criados: number;
  };
};

export const eItemHistoricoEvento = (
  item: ItemHistoricoPista,
): item is ItemHistoricoEvento => item.tipo === "evento";

export const eItemHistoricoRole = (
  item: ItemHistoricoPista,
): item is ItemHistoricoRole => item.tipo === "role";
