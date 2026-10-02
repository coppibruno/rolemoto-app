import { describe, expect, it } from "vitest";
import type { PontoGps } from "./calcular-metricas";
import {
  MAX_PONTOS_TRACADO,
  codificarPolyline,
  decodificarPolyline,
  gerarTracado,
  pontosDoTracado,
  simplificarTracado,
} from "./tracado";

const t0 = Date.parse("2026-10-02T12:00:00.000Z");

/** ~11 m por passo em latitude a cada 2 s (~20 km/h). */
const reta = (n: number, inicio = 0): PontoGps[] =>
  Array.from({ length: n }, (_, i) => ({
    lat: -27.6 + (inicio + i) * 0.0001,
    lng: -48.5,
    t: t0 + (inicio + i) * 2000,
    speed: 5.5,
    accuracy: 8,
  }));

describe("codificarPolyline / decodificarPolyline", () => {
  it("bate com o exemplo da documentação do Google", () => {
    const pontos = [
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ];
    expect(codificarPolyline(pontos)).toBe("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
  });

  it("ida e volta preserva 5 casas", () => {
    const pontos = [
      { lat: -27.59543, lng: -48.54821 },
      { lat: -27.6012, lng: -48.55003 },
      { lat: -23.55052, lng: -46.63331 },
    ];
    expect(decodificarPolyline(codificarPolyline(pontos))).toEqual(pontos);
  });

  it("ignora texto inválido ou truncado", () => {
    expect(decodificarPolyline("")).toEqual([]);
    expect(decodificarPolyline("   ")).toEqual([]);
    const completo = codificarPolyline([
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
    ]);
    expect(decodificarPolyline(completo.slice(0, -1))).toEqual([
      { lat: 1, lng: 2 },
    ]);
  });
});

describe("simplificarTracado", () => {
  it("reduz uma reta aos extremos", () => {
    const pontos = reta(50).map(({ lat, lng }) => ({ lat, lng }));
    const simples = simplificarTracado(pontos, 8);
    expect(simples).toEqual([pontos[0], pontos[49]]);
  });

  it("mantém a quina de uma curva em L", () => {
    const ida = Array.from({ length: 20 }, (_, i) => ({
      lat: -27.6 + i * 0.0001,
      lng: -48.5,
    }));
    const volta = Array.from({ length: 20 }, (_, i) => ({
      lat: -27.6 + 19 * 0.0001,
      lng: -48.5 + (i + 1) * 0.0001,
    }));
    const simples = simplificarTracado([...ida, ...volta], 8);
    expect(simples).toHaveLength(3);
    expect(simples[1]).toEqual(ida[19]);
  });
});

describe("pontosDoTracado", () => {
  it("descarta fix impreciso e salto impossível", () => {
    const base = reta(5);
    const ruins: PontoGps[] = [
      { lat: -27.7, lng: -48.6, t: t0 + 2500, speed: null, accuracy: 80 },
      { lat: -26.0, lng: -48.5, t: t0 + 4500, speed: null, accuracy: 5 },
    ];
    const aceitos = pontosDoTracado([...base, ...ruins]);
    expect(aceitos).toHaveLength(5);
    expect(aceitos.every((p) => p.lat < -27.5)).toBe(true);
  });
});

describe("gerarTracado", () => {
  it("devolve vazio sem pontos suficientes", () => {
    expect(gerarTracado([])).toBe("");
    expect(gerarTracado(reta(1))).toBe("");
  });

  it("respeita o teto de pontos em passeio longo e sinuoso", () => {
    const zigueZague: PontoGps[] = Array.from({ length: 8000 }, (_, i) => ({
      lat: -27.6 + i * 0.0001,
      lng: -48.5 + (i % 2) * 0.0003,
      t: t0 + i * 2000,
      speed: 10,
      accuracy: 5,
    }));
    const tracado = gerarTracado(zigueZague);
    const pontos = decodificarPolyline(tracado);
    expect(pontos.length).toBeGreaterThanOrEqual(2);
    expect(pontos.length).toBeLessThanOrEqual(MAX_PONTOS_TRACADO);
    expect(tracado.length).toBeLessThanOrEqual(20_000);
  });
});
