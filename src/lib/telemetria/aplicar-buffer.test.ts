import { describe, expect, it } from "vitest";
import { incorporarBuffer, mesclarComRemoto } from "./aplicar-buffer";
import { estadoCalculoInicial, type PontoGps } from "./calcular-metricas";

const t0 = Date.parse("2026-09-28T12:00:00.000Z");

const ponto = (parcial: Partial<PontoGps> & { t: number }): PontoGps => ({
  lat: -27.6,
  lng: -48.5,
  accuracy: 10,
  speed: 10,
  ...parcial,
});

describe("incorporarBuffer", () => {
  it("mantém o local se o buffer estiver vazio", () => {
    const local = {
      ...estadoCalculoInicial(),
      distanciaKm: 1.2,
      velocidadeMaxKmh: 40,
    };
    expect(incorporarBuffer(local, [])).toEqual(local);
  });

  it("recomputa km a partir dos pontos nativos", () => {
    const pontos: PontoGps[] = [
      ponto({ t: t0, lat: 0, lng: 0, speed: 0 }),
      ponto({ t: t0 + 5000, lat: 0.0003, lng: 0, speed: 8 }),
    ];
    const estado = incorporarBuffer(estadoCalculoInicial(), pontos);
    expect(estado.distanciaKm).toBeGreaterThan(0.02);
    expect(estado.ultimo?.lat).toBe(0.0003);
  });

  it("não zera km se o buffer tiver menos distância que o local", () => {
    const local = {
      ...estadoCalculoInicial(),
      distanciaKm: 12,
      velocidadeMaxKmh: 80,
      tempoMovimentoSegundos: 600,
    };
    const estado = incorporarBuffer(local, [
      ponto({ t: t0, lat: 0, lng: 0 }),
      ponto({ t: t0 + 2000, lat: 0.00001, lng: 0 }),
    ]);
    expect(estado.distanciaKm).toBe(12);
  });
});

describe("mesclarComRemoto", () => {
  it("ignora remoto vazio", () => {
    const local = { ...estadoCalculoInicial(), distanciaKm: 3 };
    expect(mesclarComRemoto(local, estadoCalculoInicial())).toEqual(local);
    expect(mesclarComRemoto(local, null)).toEqual(local);
  });

  it("prefere o lado com mais distância", () => {
    const local = {
      ...estadoCalculoInicial(),
      distanciaKm: 2,
      velocidadeMaxKmh: 30,
      somaVelocidadesKmh: 40,
      quantidadeVelocidades: 2,
    };
    const remoto = {
      ...estadoCalculoInicial(),
      distanciaKm: 5,
      velocidadeMaxKmh: 20,
      somaVelocidadesKmh: 100,
      quantidadeVelocidades: 4,
      tempoMovimentoSegundos: 100,
      ultimo: { lat: 1, lng: 1, t: t0 },
    };
    const mesclado = mesclarComRemoto(local, remoto);
    expect(mesclado.distanciaKm).toBe(5);
    expect(mesclado.velocidadeMaxKmh).toBe(30);
    expect(mesclado.somaVelocidadesKmh).toBe(100);
    expect(mesclado.quantidadeVelocidades).toBe(4);
  });
});
