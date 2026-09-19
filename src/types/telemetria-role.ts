/** Documento persistido — sem polyline no MVP. */
export type TelemetriaRole = {
  id: string;
  usuarioId: string;
  roleId: string;
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  distanciaKm: number;
  tempoSegundos: number;
  tempoMovimentoSegundos: number;
  iniciadoEm: string;
  encerradoEm: string;
  createdAt: string;
  updatedAt: string;
};

export type TelemetriaRoleCreate = {
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  distanciaKm: number;
  tempoSegundos: number;
  tempoMovimentoSegundos: number;
  iniciadoEm: string;
  encerradoEm: string;
};

/** Estado local da sessão (plugin / adapter) — não vai inteiro à API. */
export type SessaoTelemetriaLocal = {
  roleId: string;
  iniciadoEm: string;
  distanciaKm: number;
  velocidadeMaxKmh: number;
  ultimo: { lat: number; lng: number; t: number } | null;
  tempoMovimentoSegundos: number;
};
