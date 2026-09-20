import { describe, expect, it } from "vitest";
import {
  aplicarPonto,
  arredondarParaPost,
  estadoCalculoInicial,
  haversineKm,
  processarPontos,
  velocidadeMediaKmh,
  type PontoGps,
} from "./calcular-metricas";

const t0 = Date.parse("2026-09-18T12:00:00.000Z");

const ponto = (parcial: Partial<PontoGps> & { t: number }): PontoGps => ({
  lat: -23.55,
  lng: -46.63,
  accuracy: 10,
  speed: 0,
  ...parcial,
});

describe("haversineKm", () => {
  it("é ~0 no mesmo ponto", () => {
    expect(haversineKm(-23.55, -46.63, -23.55, -46.63)).toBeCloseTo(0, 6);
  });

  it("mede ~111 km por 1° de latitude", () => {
    expect(haversineKm(0, 0, 1, 0)).toBeCloseTo(111.19, 1);
  });
});

describe("processarPontos", () => {
  it("descarta ponto com accuracy 200 m", () => {
    const estado = processarPontos([
      ponto({ t: t0, lat: 0, lng: 0 }),
      ponto({ t: t0 + 5000, lat: 0.01, lng: 0, accuracy: 200, speed: 20 }),
    ]);
    expect(estado.distanciaKm).toBe(0);
    expect(estado.ultimo?.lat).toBe(0);
  });

  it("descarta salto teleporte (> 200 km/h)", () => {
    const estado = processarPontos([
      ponto({ t: t0, lat: 0, lng: 0 }),
      ponto({ t: t0 + 1000, lat: 1, lng: 0, speed: 30 }),
    ]);
    expect(estado.distanciaKm).toBe(0);
    expect(estado.ultimo?.lat).toBe(0);
  });

  it("pega o pico de speed do sensor na máxima", () => {
    const estado = processarPontos([
      ponto({ t: t0, lat: 0, lng: 0, speed: 10 }),
      ponto({ t: t0 + 2000, lat: 0.0002, lng: 0, speed: 25.7 }),
      ponto({ t: t0 + 4000, lat: 0.0004, lng: 0, speed: 12 }),
    ]);
    expect(estado.velocidadeMaxKmh).toBeCloseTo(25.7 * 3.6, 1);
  });

  it("não soma distância nem movimento parado ≥ 10 s abaixo de 3 km/h", () => {
    const pontos: PontoGps[] = [ponto({ t: t0, lat: -23.55, lng: -46.63, speed: 0 })];
    for (let i = 1; i <= 180; i += 1) {
      pontos.push(
        ponto({
          t: t0 + i * 10_000,
          lat: -23.55 + 0.000001 * (i % 2),
          lng: -46.63,
          speed: 0.2,
        }),
      );
    }
    const estado = processarPontos(pontos);
    expect(estado.distanciaKm).toBeLessThan(0.05);
    expect(estado.tempoMovimentoSegundos).toBeLessThan(20);
  });

  it("A/B são o primeiro e o último ponto aceitos", () => {
    const estado = processarPontos([
      ponto({ t: t0, lat: -23.55, lng: -46.63 }),
      ponto({ t: t0 + 2000, lat: -23.54, lng: -46.62, speed: 15 }),
      ponto({
        t: t0 + 4000,
        lat: 0,
        lng: 0,
        accuracy: 200,
        speed: 15,
      }),
      ponto({ t: t0 + 6000, lat: -23.53, lng: -46.61, speed: 15 }),
    ]);
    expect(estado.primeiro).toEqual({
      lat: -23.55,
      lng: -46.63,
      t: t0,
    });
    expect(estado.ultimo).toEqual({
      lat: -23.53,
      lng: -46.61,
      t: t0 + 6000,
    });
  });

  it("média usa só tempo em movimento", () => {
    expect(velocidadeMediaKmh(48, 1800)).toBeCloseTo(96, 5);
    expect(velocidadeMediaKmh(10, 0)).toBe(0);
  });

  it("ida e volta no mesmo ponto sem deslocamento ≈ 0 km", () => {
    const estado = processarPontos([
      ponto({ t: t0 }),
      ponto({ t: t0 + 2000 }),
      ponto({ t: t0 + 4000 }),
    ]);
    expect(estado.distanciaKm).toBeCloseTo(0, 4);
  });
});

describe("aplicarPonto", () => {
  it("acumula trecho conhecido", () => {
    let estado = estadoCalculoInicial();
    estado = aplicarPonto(estado, ponto({ t: t0, lat: 0, lng: 0, speed: 20 }));
    estado = aplicarPonto(
      estado,
      ponto({ t: t0 + 60_000, lat: 0.01, lng: 0, speed: 20 }),
    );
    expect(estado.distanciaKm).toBeCloseTo(haversineKm(0, 0, 0.01, 0), 5);
    expect(estado.tempoMovimentoSegundos).toBe(60);
  });
});

describe("arredondarParaPost", () => {
  it("arredonda máx/média 1 casa, km 2 casas, tempos inteiros", () => {
    const dados = arredondarParaPost({
      velocidadeMaxKmh: 92.55,
      velocidadeMediaKmh: 48.14,
      distanciaKm: 12.345,
      tempoSegundos: 100.9,
      tempoMovimentoSegundos: 80.2,
    });
    expect(dados).toEqual({
      velocidadeMaxKmh: 92.6,
      velocidadeMediaKmh: 48.1,
      distanciaKm: 12.35,
      tempoSegundos: 100,
      tempoMovimentoSegundos: 80,
    });
  });
});
