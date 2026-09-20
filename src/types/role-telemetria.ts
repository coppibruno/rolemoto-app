export type PontoTelemetria = {
  lat: number;
  lng: number;
  nome: string;
  endereco: string;
};

export type RoleTelemetria = {
  id: string;
  usuarioId: string;
  titulo: string;
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  distanciaKm: number;
  tempoSegundos: number;
  tempoMovimentoSegundos: number;
  iniciadoEm: string;
  encerradoEm: string;
  pontoInicio: PontoTelemetria;
  pontoFim: PontoTelemetria;
  createdAt: string;
  updatedAt: string;
};

export type RoleTelemetriaCreate = {
  titulo: string;
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  distanciaKm: number;
  tempoSegundos: number;
  tempoMovimentoSegundos: number;
  iniciadoEm: string;
  encerradoEm: string;
  pontoInicio: PontoTelemetria;
  pontoFim: PontoTelemetria;
};

export type ItemHistoricoTelemetria = {
  id: string;
  tipo: "telemetria";
  titulo: string;
  distanciaKm: number;
  tempoSegundos: number;
  encerradoEm: string;
};

/** Estado local da sessão (plugin / adapter) — não vai inteiro à API. */
export type SessaoTelemetriaLocal = {
  sessaoId: string;
  iniciadoEm: string;
  distanciaKm: number;
  velocidadeMaxKmh: number;
  primeiro: {lat: number; lng: number; t: number} | null;
  ultimo: {lat: number; lng: number; t: number} | null;
  tempoMovimentoSegundos: number;
};
