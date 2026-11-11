import {describe, expect, it} from "vitest";
import type {PontoGps} from "./calcular-metricas-telemetria";
import {avaliarPassagens, type PinoConquista} from "./passagem-conquista";
import {codificarPolyline} from "./tracado";

const METROS_POR_GRAU = (6371 * 1000 * Math.PI) / 180;
const t0 = Date.parse("2026-11-11T13:00:00.000Z");
const pino: PinoConquista = {
  id: "serra-rio-do-rastro",
  lat: -28.399,
  lng: -49.5478,
  raioMetros: 500,
};

const norte = (metros: number): number => pino.lat + metros / METROS_POR_GRAU;

/** Traçado norte-sul que cruza o pino. */
const tracadoPeloPino = codificarPolyline([
  {lat: norte(-2000), lng: pino.lng},
  {lat: norte(2000), lng: pino.lng},
]);

/** Pontos a cada 2 s, andando para o norte a partir de `deMetros`. */
const trecho = (
  deMetros: number,
  quantidade: number,
  opcoes: {inicioMs?: number; passoM?: number; speedMs?: number[] | number} = {},
): PontoGps[] => {
  const passoM = opcoes.passoM ?? 20;
  const inicioMs = opcoes.inicioMs ?? t0;
  return Array.from({length: quantidade}, (_, i) => {
    const speed = Array.isArray(opcoes.speedMs) ?
      opcoes.speedMs[i] :
      opcoes.speedMs ?? passoM / 2;
    return {
      lat: norte(deMetros + i * passoM),
      lng: pino.lng,
      t: inicioMs + i * 2000,
      speed,
      accuracy: 5,
    };
  });
};

const avaliar = (pontos: PontoGps[], tracado = tracadoPeloPino) =>
  avaliarPassagens({
    tracado,
    iniciadoEmMs: t0 - 60_000,
    encerradoEmMs: t0 + 3_600_000,
    conquistas: [pino],
    amostras: [{conquistaId: pino.id, pontos}],
  });

describe("avaliarPassagens — círculo", () => {
  it("ponto a 400 m de um pino com raio 500 entra; a 600 m sai", () => {
    expect(avaliar(trecho(400, 4))).toEqual([
      {conquistaId: pino.id, velocidadeMaxKmh: 36},
    ]);
    expect(avaliar(trecho(600, 4))).toEqual([]);
  });

  it("descarta o ponto da amostra fora do círculo antes da conta", () => {
    // 459, 479, 499 dentro (40 m); 519 e 539 fora completariam 80 m.
    expect(avaliar(trecho(459, 5))).toEqual([]);
  });
});

describe("avaliarPassagens — trecho", () => {
  it("trecho contínuo de 60 m aceitos concede; de 40 m não", () => {
    expect(avaliar(trecho(0, 4))).toHaveLength(1);
    expect(avaliar(trecho(0, 3))).toEqual([]);
  });

  it("dois grupos separados por 11 s não somam os metros", () => {
    const a = trecho(0, 3);
    const b = trecho(60, 3, {inicioMs: t0 + 4000 + 11_000});
    expect(avaliar([...a, ...b])).toEqual([]);
  });

  it("com 9 s entre os grupos o trecho é um só e concede", () => {
    const a = trecho(0, 3);
    const b = trecho(60, 3, {inicioMs: t0 + 4000 + 9_000});
    expect(avaliar([...a, ...b])).toHaveLength(1);
  });

  it("pico isolado do sensor não vira a máxima", () => {
    const pontos = trecho(0, 6, {speedMs: [10, 10, 10, 80 / 3.6, 10, 10]});
    expect(avaliar(pontos)).toEqual([
      {conquistaId: pino.id, velocidadeMaxKmh: 36},
    ]);
  });

  it("dois trechos válidos no mesmo pino: sai a maior velocidade, com uma casa", () => {
    const lento = trecho(-200, 5);
    const rapido = trecho(0, 5, {
      inicioMs: t0 + 60_000,
      passoM: 23.36,
      speedMs: 11.6806,
    });
    expect(avaliar([...lento, ...rapido])).toEqual([
      {conquistaId: pino.id, velocidadeMaxKmh: 42.1},
    ]);
  });

  it("ignora pontos fora da janela da sessão (± 2 min)", () => {
    const antigos = trecho(0, 5, {inicioMs: t0 - 60_000 - 130_000});
    expect(avaliar(antigos)).toEqual([]);
  });
});

describe("avaliarPassagens — traçado", () => {
  const linhaLesteOeste = (metrosAoNorte: number) =>
    codificarPolyline([
      {lat: norte(metrosAoNorte), lng: pino.lng - 0.02},
      {lat: norte(metrosAoNorte), lng: pino.lng + 0.02},
    ]);

  it("traçado a raio + 81 m não concede, mesmo com amostra dentro do círculo", () => {
    expect(avaliar(trecho(0, 5), linhaLesteOeste(581))).toEqual([]);
  });

  it("traçado a raio + 79 m concede pelo segmento, sem vértice perto", () => {
    expect(avaliar(trecho(0, 5), linhaLesteOeste(579))).toHaveLength(1);
  });

  it("traçado sem dois vértices não concede", () => {
    const umPonto = codificarPolyline([{lat: pino.lat, lng: pino.lng}]);
    expect(avaliar(trecho(0, 5), umPonto)).toEqual([]);
    expect(avaliar(trecho(0, 5), "")).toEqual([]);
  });

  it("amostra com id fora do catálogo é descartada", () => {
    expect(
      avaliarPassagens({
        tracado: tracadoPeloPino,
        iniciadoEmMs: t0 - 60_000,
        encerradoEmMs: t0 + 3_600_000,
        conquistas: [pino],
        amostras: [{conquistaId: "inventada", pontos: trecho(0, 5)}],
      }),
    ).toEqual([]);
  });
});
