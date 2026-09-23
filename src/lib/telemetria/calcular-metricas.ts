const RAIO_TERRA_KM = 6371;
/** Aceita fixes de rede (Capgo networkFallback); GPS fino costuma ser < 20 m. */
const ACCURACY_MAX_M = 100;
const DELTA_TEMPO_MIN_MS = 1000;
const VELOCIDADE_ABSURDA_KMH = 200;
const PARADO_KMH = 3;
const PARADO_MIN_MS = 10_000;

export type PontoGps = {
  lat: number;
  lng: number;
  t: number;
  speed?: number | null;
  accuracy?: number | null;
};

export type CoordGps = { lat: number; lng: number; t: number };

export type EstadoCalculo = {
  distanciaKm: number;
  velocidadeMaxKmh: number;
  tempoMovimentoSegundos: number;
  primeiro: CoordGps | null;
  ultimo: CoordGps | null;
  paradoDesde: number | null;
};

const toRad = (graus: number): number => (graus * Math.PI) / 180;

export const haversineKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(a));
};

export const estadoCalculoInicial = (): EstadoCalculo => ({
  distanciaKm: 0,
  velocidadeMaxKmh: 0,
  tempoMovimentoSegundos: 0,
  primeiro: null,
  ultimo: null,
  paradoDesde: null,
});

const velocidadeDoSensorKmh = (ponto: PontoGps): number | null => {
  if (ponto.speed === null || ponto.speed === undefined || ponto.speed < 0) {
    return null;
  }
  return ponto.speed * 3.6;
};

export const aplicarPonto = (
  estado: EstadoCalculo,
  ponto: PontoGps,
): EstadoCalculo => {
  if (
    ponto.accuracy !== null &&
    ponto.accuracy !== undefined &&
    ponto.accuracy > ACCURACY_MAX_M
  ) {
    return estado;
  }

  const aceito: CoordGps = { lat: ponto.lat, lng: ponto.lng, t: ponto.t };

  if (!estado.ultimo) {
    return {
      ...estado,
      primeiro: estado.primeiro ?? aceito,
      ultimo: aceito,
      velocidadeMaxKmh: Math.max(
        estado.velocidadeMaxKmh,
        velocidadeDoSensorKmh(ponto) ?? 0,
      ),
    };
  }

  const deltaMs = ponto.t - estado.ultimo.t;
  if (deltaMs < DELTA_TEMPO_MIN_MS) {
    return estado;
  }

  const trechoKm = haversineKm(
    estado.ultimo.lat,
    estado.ultimo.lng,
    ponto.lat,
    ponto.lng,
  );
  const estimadaKmh = trechoKm / (deltaMs / 3_600_000);
  if (estimadaKmh > VELOCIDADE_ABSURDA_KMH) {
    return estado;
  }

  const sensorKmh = velocidadeDoSensorKmh(ponto);
  const usadaKmh = sensorKmh ?? estimadaKmh;
  const parado =
    usadaKmh < PARADO_KMH
      ? (estado.paradoDesde ?? estado.ultimo.t)
      : null;
  const ignoraMicroRuido =
    parado !== null && ponto.t - parado >= PARADO_MIN_MS;

  if (ignoraMicroRuido) {
    return {
      ...estado,
      paradoDesde: parado,
      ultimo: { lat: ponto.lat, lng: ponto.lng, t: ponto.t },
    };
  }

  const deltaMovimento = Math.floor(deltaMs / 1000);
  return {
    distanciaKm: estado.distanciaKm + trechoKm,
    velocidadeMaxKmh: Math.max(estado.velocidadeMaxKmh, usadaKmh),
    tempoMovimentoSegundos: estado.tempoMovimentoSegundos + deltaMovimento,
    primeiro: estado.primeiro,
    ultimo: aceito,
    paradoDesde: parado,
  };
};

export const processarPontos = (pontos: PontoGps[]): EstadoCalculo =>
  pontos.reduce(aplicarPonto, estadoCalculoInicial());

export const velocidadeMediaKmh = (
  distanciaKm: number,
  tempoMovimentoSegundos: number,
): number => {
  if (tempoMovimentoSegundos <= 0) return 0;
  return distanciaKm / (tempoMovimentoSegundos / 3600);
};

export const tempoParedeSegundos = (
  iniciadoEmIso: string,
  encerradoEmIso: string,
): number =>
  Math.max(
    0,
    Math.floor((Date.parse(encerradoEmIso) - Date.parse(iniciadoEmIso)) / 1000),
  );

export const arredondarParaPost = (dados: {
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  distanciaKm: number;
  tempoSegundos: number;
  tempoMovimentoSegundos: number;
}): {
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  distanciaKm: number;
  tempoSegundos: number;
  tempoMovimentoSegundos: number;
} => {
  const velocidadeMaxKmh = Math.round(dados.velocidadeMaxKmh * 10) / 10;
  const velocidadeMediaKmh = Math.min(
    Math.round(dados.velocidadeMediaKmh * 10) / 10,
    velocidadeMaxKmh,
  );
  return {
    velocidadeMaxKmh,
    velocidadeMediaKmh,
    distanciaKm: Math.round(dados.distanciaKm * 100) / 100,
    tempoSegundos: Math.floor(dados.tempoSegundos),
    tempoMovimentoSegundos: Math.floor(
      Math.min(dados.tempoMovimentoSegundos, dados.tempoSegundos),
    ),
  };
};
