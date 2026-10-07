const RAIO_TERRA_KM = 6371;
/** Aceita fixes de rede (Capgo networkFallback); GPS fino costuma ser < 20 m. */
const ACCURACY_MAX_M = 100;
const DELTA_TEMPO_MIN_MS = 1000;
/** Teto absoluto, alinhado ao limite do POST (350 km/h). */
const VELOCIDADE_TETO_KMH = 350;
/** ~12 m/s²: cobre 0 a 100 km/h em 3 s. */
const ACEL_MAX_KMH_POR_S = 43;
const MARGEM_SENSOR_KMH = 15;
const MARGEM_SENSOR_RATIO = 0.3;
const PARADO_KMH = 3;
const PARADO_MIN_MS = 10_000;
/** Velocidade do chip só entra na máxima com fix fino. */
const ACCURACY_MAX_VELOCIDADE_M = 20;
/** Sem velocidade do chip, a haversine de 2 s só serve com fix muito fino. */
const ACCURACY_MAX_ESTIMADA_M = 10;
/** Depois de um buraco no GPS, as amostras antigas não confirmam as novas. */
const INTERVALO_MAX_VELOCIDADE_MS = 10_000;
/** A máxima é a 2ª maior das últimas N amostras: pico isolado não conta. */
const AMOSTRAS_CONFIRMACAO = 3;
const PROVIDER_REDE = "network";
/** Mesma janela do Capgo: perto de um fix GPS, o de rede só desenha zigue-zague. */
const REDE_COM_GPS_MS = 20_000;

export type PontoGps = {
  lat: number;
  lng: number;
  t: number;
  speed?: number | null;
  accuracy?: number | null;
  /** `network` (Wi-Fi/celular) erra dezenas de metros e não traz velocidade. */
  provider?: string | null;
};

export type CoordGps = { lat: number; lng: number; t: number };

export type EstadoCalculo = {
  distanciaKm: number;
  velocidadeMaxKmh: number;
  /** Última velocidade aceita. A máxima da viagem não serve para julgar o próximo trecho. */
  velocidadeAtualKmh: number;
  /** Soma das velocidades aceitas em movimento, para a média aritmética. */
  somaVelocidadesKmh: number;
  quantidadeVelocidades: number;
  tempoMovimentoSegundos: number;
  primeiro: CoordGps | null;
  ultimo: CoordGps | null;
  paradoDesde: number | null;
  /** Últimas velocidades candidatas à máxima. Opcional: sessões antigas não têm. */
  velocidadesRecentesKmh?: number[];
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
  velocidadeAtualKmh: 0,
  somaVelocidadesKmh: 0,
  quantidadeVelocidades: 0,
  tempoMovimentoSegundos: 0,
  primeiro: null,
  ultimo: null,
  paradoDesde: null,
  velocidadesRecentesKmh: [],
});

const velocidadeDoSensorKmh = (ponto: PontoGps): number | null => {
  if (ponto.speed === null || ponto.speed === undefined || ponto.speed < 0) {
    return null;
  }
  return ponto.speed * 3.6;
};

const tetoDoTrechoKmh = (anteriorKmh: number, deltaSegundos: number): number =>
  Math.min(
    VELOCIDADE_TETO_KMH,
    Math.max(0, anteriorKmh) + ACEL_MAX_KMH_POR_S * deltaSegundos,
  );

/** Distância crível no intervalo, acelerando até o teto. */
const distanciaMaximaKm = (
  anteriorKmh: number,
  tetoKmh: number,
  deltaSegundos: number,
): number =>
  ((Math.max(0, anteriorKmh) + tetoKmh) / 2) * (deltaSegundos / 3600);

/**
 * Velocidade no fim do trecho se a aceleração foi constante.
 * Numa arrancada o chip marca o instante final; a haversine marca a média.
 */
const fimDoTrechoKmh = (
  anteriorKmh: number,
  estimadaKmh: number,
  tetoKmh: number,
): number => {
  const fim = 2 * estimadaKmh - Math.max(0, anteriorKmh);
  return Math.min(tetoKmh, Math.max(0, fim));
};

/** O chip entra se bater com a velocidade final do trecho e couber no teto. */
const sensorDoTrecho = (
  sensorKmh: number | null,
  fimKmh: number,
  tetoKmh: number,
): number | null => {
  if (sensorKmh === null || sensorKmh > tetoKmh) return null;
  const margem = Math.max(MARGEM_SENSOR_KMH, fimKmh * MARGEM_SENSOR_RATIO);
  if (Math.abs(sensorKmh - fimKmh) > margem) return null;
  return sensorKmh;
};

const fixFino = (ponto: PontoGps, limiteM: number): boolean =>
  ponto.accuracy !== null &&
  ponto.accuracy !== undefined &&
  ponto.accuracy <= limiteM;

/**
 * Candidata à máxima: o Doppler do chip, que não sofre com o salto da posição.
 * A haversine só entra se o aparelho não informa velocidade nenhuma.
 */
const candidataMaximaKmh = (
  ponto: PontoGps,
  estimadaKmh: number | null,
  tetoKmh: number,
): number | null => {
  const sensorKmh = velocidadeDoSensorKmh(ponto);
  if (sensorKmh !== null) {
    if (sensorKmh > tetoKmh) return null;
    return fixFino(ponto, ACCURACY_MAX_VELOCIDADE_M) ? sensorKmh : null;
  }
  if (estimadaKmh === null || estimadaKmh > tetoKmh) return null;
  return fixFino(ponto, ACCURACY_MAX_ESTIMADA_M) ? estimadaKmh : null;
};

/** Sem candidata a sequência quebra: a confirmação exige amostras seguidas. */
const comCandidata = (
  recentes: number[],
  candidataKmh: number | null,
): number[] =>
  candidataKmh === null
    ? []
    : [...recentes, candidataKmh].slice(-AMOSTRAS_CONFIRMACAO);

const velocidadeConfirmadaKmh = (recentes: number[]): number => {
  if (recentes.length < 2) return 0;
  return [...recentes].sort((a, b) => b - a)[1];
};

/**
 * Ordena por tempo e tira o fix de rede que tem GPS a menos de 20 s.
 * Sem GPS por perto (tela off em alguns aparelhos) a rede é o que sobra.
 */
export const descartarRedeComGps = (pontos: PontoGps[]): PontoGps[] => {
  const ordenados = [...pontos].sort((a, b) => a.t - b.t);
  const temposGps = ordenados
    .filter((ponto) => ponto.provider !== PROVIDER_REDE)
    .map((ponto) => ponto.t);
  let i = 0;
  return ordenados.filter((ponto) => {
    if (ponto.provider !== PROVIDER_REDE) return true;
    while (i < temposGps.length && temposGps[i] < ponto.t - REDE_COM_GPS_MS) {
      i += 1;
    }
    return !(i < temposGps.length && temposGps[i] <= ponto.t + REDE_COM_GPS_MS);
  });
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
      velocidadesRecentesKmh: comCandidata(
        [],
        candidataMaximaKmh(ponto, null, VELOCIDADE_TETO_KMH),
      ),
    };
  }

  const deltaMs = ponto.t - estado.ultimo.t;
  if (deltaMs < DELTA_TEMPO_MIN_MS) {
    return estado;
  }

  const deltaSegundos = deltaMs / 1000;
  const trechoKm = haversineKm(
    estado.ultimo.lat,
    estado.ultimo.lng,
    ponto.lat,
    ponto.lng,
  );
  const estimadaKmh = trechoKm / (deltaMs / 3_600_000);
  const anteriorKmh = estado.velocidadeAtualKmh ?? 0;
  const tetoKmh = tetoDoTrechoKmh(anteriorKmh, deltaSegundos);
  if (trechoKm > distanciaMaximaKm(anteriorKmh, tetoKmh, deltaSegundos)) {
    return estado;
  }

  const fimKmh = fimDoTrechoKmh(anteriorKmh, estimadaKmh, tetoKmh);
  const sensorOk = sensorDoTrecho(
    velocidadeDoSensorKmh(ponto),
    fimKmh,
    tetoKmh,
  );
  const atualKmh = sensorOk ?? fimKmh;
  const recentesAntes =
    deltaMs > INTERVALO_MAX_VELOCIDADE_MS
      ? []
      : (estado.velocidadesRecentesKmh ?? []);
  const velocidadesRecentesKmh = comCandidata(
    recentesAntes,
    candidataMaximaKmh(ponto, estimadaKmh, tetoKmh),
  );
  const velocidadeMaxKmh = Math.max(
    estado.velocidadeMaxKmh,
    velocidadeConfirmadaKmh(velocidadesRecentesKmh),
  );
  const parado =
    estimadaKmh < PARADO_KMH ? (estado.paradoDesde ?? estado.ultimo.t) : null;
  const ignoraMicroRuido = parado !== null && ponto.t - parado >= PARADO_MIN_MS;

  if (ignoraMicroRuido) {
    return {
      ...estado,
      velocidadeMaxKmh,
      velocidadeAtualKmh: atualKmh,
      paradoDesde: parado,
      ultimo: { lat: ponto.lat, lng: ponto.lng, t: ponto.t },
      velocidadesRecentesKmh,
    };
  }

  const deltaMovimento = Math.floor(deltaMs / 1000);
  return {
    distanciaKm: estado.distanciaKm + trechoKm,
    velocidadeMaxKmh,
    velocidadeAtualKmh: atualKmh,
    somaVelocidadesKmh: estado.somaVelocidadesKmh + atualKmh,
    quantidadeVelocidades: estado.quantidadeVelocidades + 1,
    tempoMovimentoSegundos: estado.tempoMovimentoSegundos + deltaMovimento,
    primeiro: estado.primeiro,
    ultimo: aceito,
    paradoDesde: parado,
    velocidadesRecentesKmh,
  };
};

export const processarPontos = (pontos: PontoGps[]): EstadoCalculo =>
  descartarRedeComGps(pontos).reduce(aplicarPonto, estadoCalculoInicial());

/** Média aritmética: soma das velocidades aceitas / quantidade. */
export const velocidadeMediaKmh = (
  somaVelocidadesKmh: number,
  quantidadeVelocidades: number,
): number => {
  if (quantidadeVelocidades <= 0) return 0;
  return somaVelocidadesKmh / quantidadeVelocidades;
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
