/** Vértices abaixo disso pintam no frio e não entram no min/max. */
export const LIMIAR_PARADO_KMH = 5;
/** Abaixo disso o passeio cai no traçado laranja único (sem legenda). */
export const LIMIAR_VARIACAO_KMH = 3;
/** Quantiza o degradê para fundir microsegmentos iguais no Maps. */
const PASSOS_COR = 24;

const COR_FRIO = { r: 56, g: 189, b: 248 }; // #38bdf8 (marcador A)
const COR_QUENTE = { r: 249, g: 115, b: 22 }; // #f97316 (marcador B)

export type EscalaVelocidadeTracado = {
  minKmh: number;
  maxKmh: number;
  /** Cor de cada segmento i→i+1; length = velocidades.length - 1. */
  coresSegmentos: string[];
};

const hexRgb = (r: number, g: number, b: number): string => {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
};

/** t ∈ [0, 1] → ciano…laranja, quantizado. */
export const corVelocidadeRelativa = (t: number): string => {
  const passo = Math.round(Math.min(1, Math.max(0, t)) * PASSOS_COR) / PASSOS_COR;
  return hexRgb(
    COR_FRIO.r + (COR_QUENTE.r - COR_FRIO.r) * passo,
    COR_FRIO.g + (COR_QUENTE.g - COR_FRIO.g) * passo,
    COR_FRIO.b + (COR_QUENTE.b - COR_FRIO.b) * passo,
  );
};

const tDaVelocidade = (kmh: number, minKmh: number, maxKmh: number): number => {
  if (kmh < LIMIAR_PARADO_KMH) return 0;
  const span = maxKmh - minKmh;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (kmh - minKmh) / span));
};

/**
 * Escala relativa ao passeio para colorir o traçado.
 * `null` = sem variação útil (ou dados insuficientes) → polyline laranja.
 */
export const escalaVelocidadeTracado = (
  velocidades: number[],
): EscalaVelocidadeTracado | null => {
  if (velocidades.length < 2) return null;

  let minKmh = Number.POSITIVE_INFINITY;
  let maxKmh = Number.NEGATIVE_INFINITY;
  for (const kmh of velocidades) {
    if (kmh < LIMIAR_PARADO_KMH) continue;
    if (kmh < minKmh) minKmh = kmh;
    if (kmh > maxKmh) maxKmh = kmh;
  }
  if (!Number.isFinite(minKmh) || !Number.isFinite(maxKmh)) return null;
  if (maxKmh - minKmh < LIMIAR_VARIACAO_KMH) return null;

  const coresSegmentos: string[] = [];
  for (let i = 0; i < velocidades.length - 1; i += 1) {
    const media = (velocidades[i] + velocidades[i + 1]) / 2;
    coresSegmentos.push(corVelocidadeRelativa(tDaVelocidade(media, minKmh, maxKmh)));
  }

  return { minKmh, maxKmh, coresSegmentos };
};

/** Índice do pico de velocidade no traçado (−1 se vazio). */
export const indiceVelocidadeMaxima = (velocidades: number[]): number => {
  if (velocidades.length === 0) return -1;
  let melhor = 0;
  for (let i = 1; i < velocidades.length; i += 1) {
    if (velocidades[i] > velocidades[melhor]) melhor = i;
  }
  return melhor;
};
