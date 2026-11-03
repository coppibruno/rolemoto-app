import type { AcessoEvento, AtracaoEvento, TipoEvento } from "./evento";
import type { Localizacao } from "./role";

export type StatusSerieEvento = "ativa" | "pausada" | "encerrada";

export type SerieEvento = {
  id: string;
  titulo: string;
  tipo: TipoEvento | "moto_point_semanal";
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
  proxima: {
    id: string;
    dataHoraAbertura: string;
    dataHoraEncerramento: string | null;
  } | null;
};

export type OcorrenciaSerie = {
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
  ocorrencias: OcorrenciaSerie[];
};

export type SerieEventoCriada = {
  serie: SerieEvento;
  ocorrencias: { id: string }[];
};

export type PublicacaoSerie = {
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
};
