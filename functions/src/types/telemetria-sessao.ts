import type {CoordGps, EstadoCalculo} from "../lib/calcular-metricas-telemetria";

/** Sessão ao vivo (agregação Capgo native POST com tela off). */
export type TelemetriaSessao = {
  id: string;
  usuarioId: string;
  iniciadoEm: string;
  distanciaKm: number;
  velocidadeMaxKmh: number;
  tempoMovimentoSegundos: number;
  primeiro: CoordGps | null;
  ultimo: CoordGps | null;
  paradoDesde: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TelemetriaSessaoCriada = {
  id: string;
  /** Segredo de curta duração para POSTs nativos (não é JWT Firebase). */
  token: string;
  iniciadoEm: string;
};

export type TelemetriaSessaoNovo = {
  usuarioId: string;
  tokenHash: string;
  iniciadoEm: string;
} & EstadoCalculo;
