import {haversineKm, processarPontos, type PontoGps} from "./calcular-metricas-telemetria";
import {decodificarPolyline, type PontoLatLng} from "./tracado";
import type {AmostraConquista} from "../types/conquista";

/** Cobre a simplificação Douglas-Peucker do polyline (tolerância inicial 8 m). */
export const MARGEM_TRACADO_M = 80;
/** Relógio do GPS e do aparelho podem divergir um pouco das bordas da sessão. */
export const FOLGA_SESSAO_MS = 120_000;
/** Buraco maior que isto quebra o trecho; os lados não se somam. */
export const BURACO_TRECHO_MS = 10_000;
export const DISTANCIA_MIN_TRECHO_KM = 0.05;

const METROS_POR_GRAU = (6371 * 1000 * Math.PI) / 180;

export type PinoConquista = {
  id: string;
  lat: number;
  lng: number;
  raioMetros: number;
};

export type EntradaPassagem = {
  tracado: string;
  iniciadoEmMs: number;
  encerradoEmMs: number;
  conquistas: PinoConquista[];
  amostras: AmostraConquista[];
};

export type PassagemConquista = {
  conquistaId: string;
  velocidadeMaxKmh: number;
};

type Xy = {x: number; y: number};

const umaCasa = (n: number): number => Math.round(n * 10) / 10;

const distanciaAoPinoM = (pino: PinoConquista, ponto: PontoLatLng): number =>
  haversineKm(pino.lat, pino.lng, ponto.lat, ponto.lng) * 1000;

/** Projeção local em metros, com o pino na origem. */
const projetar = (pino: PinoConquista, ponto: PontoLatLng): Xy => ({
  x: (ponto.lng - pino.lng) * METROS_POR_GRAU * Math.cos((pino.lat * Math.PI) / 180),
  y: (ponto.lat - pino.lat) * METROS_POR_GRAU,
});

const distanciaOrigemAoSegmentoM = (a: Xy, b: Xy): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const comprimento2 = dx * dx + dy * dy;
  const t = comprimento2 === 0 ?
    0 :
    Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / comprimento2));
  return Math.hypot(a.x + t * dx, a.y + t * dy);
};

/** Algum vértice ou o ponto mais próximo de algum segmento cai em `raio + 80 m`. */
export const tracadoPassaPelaArea = (
  vertices: PontoLatLng[],
  pino: PinoConquista,
): boolean => {
  const limiteM = pino.raioMetros + MARGEM_TRACADO_M;
  if (vertices.some((v) => distanciaAoPinoM(pino, v) <= limiteM)) {
    return true;
  }
  for (let i = 1; i < vertices.length; i += 1) {
    const a = projetar(pino, vertices[i - 1]);
    const b = projetar(pino, vertices[i]);
    if (distanciaOrigemAoSegmentoM(a, b) <= limiteM) {
      return true;
    }
  }
  return false;
};

const quebrarEmTrechos = (pontos: PontoGps[]): PontoGps[][] => {
  const ordenados = [...pontos].sort((a, b) => a.t - b.t);
  const trechos: PontoGps[][] = [];
  let atual: PontoGps[] = [];
  for (const ponto of ordenados) {
    const anterior = atual[atual.length - 1];
    if (anterior && ponto.t - anterior.t > BURACO_TRECHO_MS) {
      trechos.push(atual);
      atual = [];
    }
    atual.push(ponto);
  }
  if (atual.length > 0) {
    trechos.push(atual);
  }
  return trechos;
};

/** Maior velocidade entre os trechos que somam ≥ 50 m aceitos; `null` se nenhum vale. */
const velocidadeDaAmostra = (
  pino: PinoConquista,
  pontos: PontoGps[],
  inicioMs: number,
  fimMs: number,
): number | null => {
  const dentro = pontos.filter((p) =>
    p.t >= inicioMs &&
    p.t <= fimMs &&
    distanciaAoPinoM(pino, p) <= pino.raioMetros,
  );
  let melhor: number | null = null;
  for (const trecho of quebrarEmTrechos(dentro)) {
    const estado = processarPontos(trecho);
    if (estado.distanciaKm < DISTANCIA_MIN_TRECHO_KM) continue;
    melhor = Math.max(melhor ?? 0, estado.velocidadeMaxKmh);
  }
  return melhor;
};

/**
 * Regra da passagem (SPEC 056 §4). Não lê recorde anterior nem escreve banco.
 * Só devolve os pinos em que o passeio passou.
 */
export const avaliarPassagens = (
  entrada: EntradaPassagem,
): PassagemConquista[] => {
  const vertices = decodificarPolyline(entrada.tracado);
  if (vertices.length < 2) return [];

  const pinos = new Map(entrada.conquistas.map((c) => [c.id, c]));
  const inicioMs = entrada.iniciadoEmMs - FOLGA_SESSAO_MS;
  const fimMs = entrada.encerradoEmMs + FOLGA_SESSAO_MS;
  const melhores = new Map<string, number>();

  for (const amostra of entrada.amostras) {
    const pino = pinos.get(amostra.conquistaId);
    if (!pino || !tracadoPassaPelaArea(vertices, pino)) continue;
    const velocidade = velocidadeDaAmostra(pino, amostra.pontos, inicioMs, fimMs);
    if (velocidade === null) continue;
    melhores.set(pino.id, Math.max(melhores.get(pino.id) ?? 0, velocidade));
  }

  return [...melhores].map(([conquistaId, velocidade]) => ({
    conquistaId,
    velocidadeMaxKmh: umaCasa(velocidade),
  }));
};
