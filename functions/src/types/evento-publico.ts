import type {CriadorPublico, ParticipanteDestaque} from "./role-publico";
import type {AcessoEvento, TipoEvento} from "./evento";

export type {CriadorPublico, ParticipanteDestaque};

/** DTO sanitizado do convite — sem lat/lng, sem inscrição, sem PII extra. */
export type EventoPublico = {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  fotoCapaUrl: string;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  acesso: AcessoEvento;
  localNome: string;
  localEndereco: string;
  informacoes: string;
  criador: CriadorPublico;
  participantes: {
    confirmados: number;
    destaques: ParticipanteDestaque[];
  };
};
