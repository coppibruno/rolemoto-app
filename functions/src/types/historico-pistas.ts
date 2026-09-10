import type {RitmoRole} from "./role";

export type StatusItemHistorico =
  | "pendente"
  | "confirmado"
  | "concluido"
  | "lider";

export type ItemHistoricoPista = {
  roleId: string;
  titulo: string;
  descricao: string;
  dataHoraSaida: string;
  distanciaKm: number;
  participantesConfirmados: number;
  ritmo: RitmoRole;
  status: StatusItemHistorico;
};

export type HistoricoPistas = {
  aguardando: ItemHistoricoPista[];
  participei: ItemHistoricoPista[];
  criados: ItemHistoricoPista[];
  contagens: {
    aguardando: number;
    participei: number;
    criados: number;
  };
};
