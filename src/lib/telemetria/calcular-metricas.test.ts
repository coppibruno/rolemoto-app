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

  it("aceita ponto de rede com accuracy 80 m (networkFallback)", () => {
    const estado = processarPontos([
      ponto({ t: t0, lat: 0, lng: 0 }),
      ponto({
        t: t0 + 5000,
        lat: 0.0003,
        lng: 0,
        accuracy: 80,
        speed: 5,
      }),
    ]);
    expect(estado.distanciaKm).toBeGreaterThan(0);
    expect(estado.ultimo?.lat).toBeCloseTo(0.0003, 5);
  });

  it("descarta salto que a aceleração anterior não explica", () => {
    const estado = processarPontos([
      ponto({ t: t0, lat: 0, lng: 0 }),
      ponto({ t: t0 + 1000, lat: 1, lng: 0, speed: 30 }),
    ]);
    expect(estado.distanciaKm).toBe(0);
    expect(estado.ultimo?.lat).toBe(0);
  });

  it("não grava 137 km/h num salto de 76 m durante a caminhada", () => {
    const passo = 0.00002;
    const salto76m = 0.076 / (2 * Math.PI * 6371 / 360);
    const estado = processarPontos([
      ponto({ t: t0, lat: 0, lng: 0, speed: null }),
      ponto({ t: t0 + 2000, lat: passo, lng: 0, speed: null }),
      ponto({ t: t0 + 4000, lat: passo + salto76m, lng: 0, speed: null }),
    ]);
    expect(estado.velocidadeMaxKmh).toBeLessThan(30);
    expect(estado.distanciaKm).toBeLessThan(0.01);
    expect(estado.ultimo?.lat).toBeCloseTo(passo, 6);
  });

  it("ignora speed absurdo do sensor se o trecho é curto", () => {
    const estado = processarPontos([
      ponto({ t: t0, lat: 0, lng: 0, speed: null }),
      ponto({ t: t0 + 2000, lat: 0.00002, lng: 0, speed: 38 }),
    ]);
    expect(estado.velocidadeMaxKmh).toBeLessThan(20);
  });

  it("sobe a máxima quando o trecho cabe na aceleração", () => {
    const graus = (metros: number) => metros / 1000 / (2 * Math.PI * 6371 / 360);
    const estado = processarPontos([
      ponto({ t: t0, lat: 0, lng: 0, speed: null }),
      ponto({ t: t0 + 2000, lat: graus(18), lng: 0, speed: null }),
      ponto({ t: t0 + 4000, lat: graus(18 + 36), lng: 0, speed: null }),
      ponto({ t: t0 + 6000, lat: graus(18 + 72), lng: 0, speed: null }),
    ]);
    expect(estado.velocidadeMaxKmh).toBeGreaterThan(60);
    expect(estado.distanciaKm).toBeGreaterThan(0.05);
  });

  it("não usa a haversine na máxima com fix de 15 m sem velocidade", () => {
    const graus = (metros: number) => metros / 1000 / (2 * Math.PI * 6371 / 360);
    const estado = processarPontos(
      [0, 18, 54, 90].map((metros, i) =>
        ponto({
          t: t0 + i * 2000,
          lat: graus(metros),
          lng: 0,
          speed: null,
          accuracy: 15,
        }),
      ),
    );
    expect(estado.velocidadeMaxKmh).toBe(0);
    expect(estado.distanciaKm).toBeGreaterThan(0.05);
  });

  it("registra 100 km/h numa arrancada de 3 s, amostrada a cada 2 s", () => {
    const graus = (metros: number) => metros / 1000 / (2 * Math.PI * 6371 / 360);
    const estado = processarPontos([
      ponto({ t: t0, lat: 0, lng: 0, speed: 0 }),
      ponto({
        t: t0 + 2000,
        lat: graus(18.52),
        lng: 0,
        speed: 66.7 / 3.6,
      }),
      ponto({
        t: t0 + 4000,
        lat: graus(69.45),
        lng: 0,
        speed: 100 / 3.6,
      }),
      ponto({
        t: t0 + 6000,
        lat: graus(125.01),
        lng: 0,
        speed: 100 / 3.6,
      }),
    ]);
    expect(estado.velocidadeMaxKmh).toBeCloseTo(100, 0);
    expect(estado.distanciaKm).toBeGreaterThan(0.06);
  });

  const graus = (metros: number) => metros / 1000 / (2 * Math.PI * 6371 / 360);
  const processarRodando = (pontos: PontoGps[]) =>
    pontos.reduce(aplicarPonto, {
      ...estadoCalculoInicial(),
      velocidadeAtualKmh: 60,
    });
  const rodando60 = (metrosPorPonto: number[], speedKmh: number[]): PontoGps[] => {
    let acumulado = 0;
    return metrosPorPonto.map((metros, i) => {
      acumulado += metros;
      return ponto({
        t: t0 + i * 2000,
        lat: graus(acumulado),
        lng: 0,
        speed: speedKmh[i] / 3.6,
      });
    });
  };

  it("não grava pico isolado do sensor numa reta a 60 km/h", () => {
    const estado = processarRodando(
      rodando60(
        [0, 33.3, 33.3, 33.3, 33.3, 33.3, 33.3],
        [60, 60, 60, 120, 60, 60, 60],
      ),
    );
    expect(estado.velocidadeMaxKmh).toBeCloseTo(60, 0);
  });

  it("usa o chip quando a posição salta 20 m a 60 km/h", () => {
    const estado = processarRodando(
      rodando60(
        [0, 33.3, 33.3, 53.3, 13.3, 33.3, 33.3],
        [60, 60, 60, 60, 60, 60, 60],
      ),
    );
    expect(estado.velocidadeMaxKmh).toBeLessThan(65);
    expect(estado.velocidadeMaxKmh).toBeGreaterThan(55);
  });

  it("não confirma a máxima com amostras separadas por buraco de GPS", () => {
    const estado = processarPontos([
      ponto({ t: t0, lat: 0, lng: 0, speed: 0 }),
      ponto({ t: t0 + 2000, lat: graus(20), lng: 0, speed: 70 / 3.6 }),
      ponto({ t: t0 + 32_000, lat: graus(620), lng: 0, speed: 70 / 3.6 }),
    ]);
    expect(estado.velocidadeMaxKmh).toBe(0);
    expect(estado.distanciaKm).toBeGreaterThan(0.6);
  });

  it("ignora ponto de rede (Wi-Fi/celular) nas métricas", () => {
    const estado = processarRodando([
      ...rodando60([0, 33.3, 33.3], [60, 60, 60]),
      ponto({
        t: t0 + 5000,
        lat: graus(66.6 + 80),
        lng: 0,
        speed: null,
        accuracy: 40,
        provider: "network",
      }),
    ]);
    expect(estado.ultimo?.lat).toBeCloseTo(graus(66.6), 8);
    expect(estado.distanciaKm).toBeCloseTo(0.0666, 3);
  });

  it("não passa de 350 km/h", () => {
    const graus = (metros: number) => metros / 1000 / (2 * Math.PI * 6371 / 360);
    let estado = estadoCalculoInicial();
    estado = aplicarPonto(
      estado,
      ponto({ t: t0, lat: 0, lng: 0, speed: null }),
    );
    estado = {
      ...estado,
      velocidadeMaxKmh: 320,
      velocidadeAtualKmh: 320,
    };
    estado = aplicarPonto(
      estado,
      ponto({
        t: t0 + 2000,
        lat: graus(178),
        lng: 0,
        speed: 400 / 3.6,
      }),
    );
    expect(estado.velocidadeMaxKmh).toBeLessThanOrEqual(350);
    expect(estado.velocidadeMaxKmh).toBeCloseTo(320, 0);
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
    expect(estado.quantidadeVelocidades).toBe(0);
  });

  it("A/B são o primeiro e o último ponto aceitos", () => {
    const passo = 0.0009;
    const estado = processarPontos([
      ponto({ t: t0, lat: -23.55, lng: -46.63, speed: null }),
      ponto({ t: t0 + 10_000, lat: -23.55 + passo, lng: -46.63, speed: null }),
      ponto({
        t: t0 + 15_000,
        lat: 0,
        lng: 0,
        accuracy: 200,
        speed: 15,
      }),
      ponto({
        t: t0 + 20_000,
        lat: -23.55 + passo * 2,
        lng: -46.63,
        speed: null,
      }),
    ]);
    expect(estado.primeiro).toEqual({
      lat: -23.55,
      lng: -46.63,
      t: t0,
    });
    expect(estado.ultimo).toEqual({
      lat: -23.55 + passo * 2,
      lng: -46.63,
      t: t0 + 20_000,
    });
  });

  it("média é a soma das velocidades dividida pela quantidade", () => {
    expect(velocidadeMediaKmh(80, 5)).toBe(16);
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
    expect(estado.quantidadeVelocidades).toBe(1);
    expect(estado.somaVelocidadesKmh).toBeCloseTo(estado.velocidadeAtualKmh, 5);
  });

  it("média aritmética das velocidades aceitas", () => {
    let estado = estadoCalculoInicial();
    const pontos = [
      ponto({ t: t0, lat: 0, lng: 0, speed: null }),
      ponto({ t: t0 + 2000, lat: 0.00005, lng: 0, speed: null }),
      ponto({ t: t0 + 4000, lat: 0.0001, lng: 0, speed: null }),
    ];
    const velocidades: number[] = [];
    for (const amostra of pontos) {
      estado = aplicarPonto(estado, amostra);
      if (estado.quantidadeVelocidades > velocidades.length) {
        velocidades.push(estado.velocidadeAtualKmh);
      }
    }
    const soma = velocidades.reduce((acc, valor) => acc + valor, 0);
    expect(estado.quantidadeVelocidades).toBe(2);
    expect(estado.somaVelocidadesKmh).toBeCloseTo(soma, 5);
    expect(
      velocidadeMediaKmh(estado.somaVelocidadesKmh, estado.quantidadeVelocidades),
    ).toBeCloseTo(soma / 2, 5);
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

  it("não deixa média acima da máxima", () => {
    const dados = arredondarParaPost({
      velocidadeMaxKmh: 3.7,
      velocidadeMediaKmh: 4.8,
      distanciaKm: 0.16,
      tempoSegundos: 125,
      tempoMovimentoSegundos: 120,
    });
    expect(dados.velocidadeMediaKmh).toBe(3.7);
    expect(dados.velocidadeMaxKmh).toBe(3.7);
  });
});
