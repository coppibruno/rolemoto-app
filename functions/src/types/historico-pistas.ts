import type {AcessoEvento} from "./evento";
import type {RitmoRole} from "./role";

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
  avaliado: boolean;
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

/** Histórico visível a outros pilotos — sem aba Aguardando. */
export type HistoricoPublico = {
  concluidos: ItemHistoricoPista[];
  comoLider: ItemHistoricoRole[];
  contagens: {
    concluidos: number;
    comoLider: number;
  };
};
