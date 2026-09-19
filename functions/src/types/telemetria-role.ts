/** Documento persistido — sem polyline no MVP. Datas em ISO. */
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
  usuarioId: string;
  roleId: string;
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  distanciaKm: number;
  tempoSegundos: number;
  tempoMovimentoSegundos: number;
  iniciadoEm: string;
  encerradoEm: string;
};
