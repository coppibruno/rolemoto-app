import type { AcessoEvento, TipoEvento } from "./evento";
import type { CriadorPublico, ParticipanteDestaque } from "./role-publico";

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
