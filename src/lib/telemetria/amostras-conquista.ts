import type { AmostraConquista, ConquistaCatalogo } from "@/types/conquista";
import { haversineKm, processarPontos, type PontoGps } from "./calcular-metricas";

/** Limites que a rota aceita; acima disso o servidor corta. */
export const MAX_AMOSTRAS = 6;
export const MAX_PONTOS_AMOSTRA = 120;
const ACCURACY_MAX_M = 100;
/** Mesmo buraco que quebra o trecho no servidor. */
const BURACO_TRECHO_MS = 10_000;

type Candidata = { amostra: AmostraConquista; distanciaKm: number };

const dentroDoCirculo = (pino: ConquistaCatalogo, ponto: PontoGps): boolean =>
  haversineKm(pino.lat, pino.lng, ponto.lat, ponto.lng) * 1000 <= pino.raioMetros;

/** Sequências contínuas dentro do círculo, sem buraco maior que 10 s. */
const sequenciasDentro = (pino: ConquistaCatalogo, pontos: PontoGps[]): PontoGps[][] => {
  const sequencias: PontoGps[][] = [];
  let atual: PontoGps[] = [];
  const fechar = () => {
    if (atual.length > 0) sequencias.push(atual);
    atual = [];
  };
  for (const ponto of pontos) {
    if (!dentroDoCirculo(pino, ponto)) {
      fechar();
      continue;
    }
    const anterior = atual[atual.length - 1];
    if (anterior && ponto.t - anterior.t > BURACO_TRECHO_MS) fechar();
    atual.push(ponto);
  }
  fechar();
  return sequencias;
};

/**
 * Reparte o tempo em 120 baldes e fica, em cada um, o ponto de maior
 * `speed` (nulo conta como −1). A ordem de tempo se mantém.
 */
export const reduzirAmostra = (pontos: PontoGps[]): PontoGps[] => {
  if (pontos.length <= MAX_PONTOS_AMOSTRA) return pontos;
  const inicio = pontos[0].t;
  const duracao = pontos[pontos.length - 1].t - inicio;
  const baldes: (PontoGps | undefined)[] = new Array(MAX_PONTOS_AMOSTRA);
  for (const ponto of pontos) {
    const indice =
      duracao <= 0
        ? 0
        : Math.min(
            MAX_PONTOS_AMOSTRA - 1,
            Math.floor(((ponto.t - inicio) / duracao) * MAX_PONTOS_AMOSTRA),
          );
    const atual = baldes[indice];
    if (!atual || (ponto.speed ?? -1) > (atual.speed ?? -1)) baldes[indice] = ponto;
  }
  return baldes.filter((p): p is PontoGps => p !== undefined);
};

const paraBody = (ponto: PontoGps): PontoGps => ({
  lat: ponto.lat,
  lng: ponto.lng,
  t: ponto.t,
  speed: ponto.speed ?? null,
  accuracy: ponto.accuracy ?? null,
  provider: ponto.provider ?? null,
});

/**
 * Escolhe os pontos que vão no `POST /telemetria`. Não concede: o servidor
 * refaz a conta. Por pino, a sequência com mais distância aceita; no
 * máximo 6 pinos, os de maior distância.
 */
export const montarAmostrasConquista = (
  pontos: PontoGps[],
  catalogo: ConquistaCatalogo[],
): AmostraConquista[] => {
  const validos = pontos
    .filter((p) => p.accuracy != null && p.accuracy <= ACCURACY_MAX_M)
    .sort((a, b) => a.t - b.t);
  if (validos.length < 2 || catalogo.length === 0) return [];

  const candidatas: Candidata[] = [];
  for (const pino of catalogo) {
    let melhor: Candidata | null = null;
    for (const sequencia of sequenciasDentro(pino, validos)) {
      const { distanciaKm } = processarPontos(sequencia);
      if (distanciaKm <= 0 || (melhor && melhor.distanciaKm >= distanciaKm)) continue;
      melhor = {
        distanciaKm,
        amostra: { conquistaId: pino.id, pontos: reduzirAmostra(sequencia).map(paraBody) },
      };
    }
    if (melhor) candidatas.push(melhor);
  }

  return candidatas
    .sort((a, b) => b.distanciaKm - a.distanciaKm)
    .slice(0, MAX_AMOSTRAS)
    .map((c) => c.amostra);
};
