import type {Localizacao} from "./role";
import type {AcessoEvento, AtracaoEvento, TipoEvento} from "./evento";

export type StatusSerieEvento = "ativa" | "pausada" | "encerrada";

export interface SerieEvento {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  local: Localizacao;
  localId: string | null;
  diaSemana: number;
  horaAbertura: string;
  horaEncerramento: string;
  aPartirDe: string | null;
  acesso: AcessoEvento;
  linkIngresso: string | null;
  atracoes: AtracaoEvento[];
  fotoCapaUrl: string;
  informacoes: string;
  excecoes: string[];
  status: StatusSerieEvento;
  criadorId: string;
  createdAt: string;
  updatedAt: string;
}

export type SerieEventoCreate = Omit<
  SerieEvento,
  "id" | "excecoes" | "status" | "createdAt" | "updatedAt"
>;

export type ProximaOcorrencia = {
  id: string;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
};

export type SerieEventoResumo = {
  id: string;
  titulo: string;
  status: StatusSerieEvento;
  diaSemana: number;
  rotulo: string;
  horaAbertura: string;
  horaEncerramento: string;
  localId: string | null;
  proxima: ProximaOcorrencia | null;
};

export type OcorrenciaSerieResumo = {
  id: string;
  ocorrenciaYmd: string | null;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  cancelada: boolean;
  ocorrenciaAjustada: boolean;
  inscritos: number;
};

export type SerieEventoDetalhe = {
  serie: SerieEvento;
  ocorrencias: OcorrenciaSerieResumo[];
};
