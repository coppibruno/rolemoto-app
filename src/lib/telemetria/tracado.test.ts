import { describe, expect, it } from "vitest";
import {
  processarPontos,
  type PontoGps,
} from "./calcular-metricas";
import { indiceVelocidadeMaxima } from "./escala-velocidade-tracado";
import {
  MAX_PONTOS_TRACADO,
  codificarPolyline,
  codificarVelocidades,
  decodificarPolyline,
  decodificarVelocidades,
  gerarTracado,
  indiceVerticeMaisProximo,
  pontosDoTracado,
  simplificarTracado,
} from "./tracado";

const t0 = Date.parse("2026-10-02T12:00:00.000Z");
const graus = (metros: number) =>
  metros / 1000 / ((2 * Math.PI * 6371) / 360);

/** ~11 m por passo em latitude a cada 2 s (~20 km/h). */
const reta = (n: number, inicio = 0): PontoGps[] =>
  Array.from({ length: n }, (_, i) => ({
    lat: -27.6 + (inicio + i) * 0.0001,
    lng: -48.5,
    t: t0 + (inicio + i) * 2000,
    speed: 5.5,
    accuracy: 8,
  }));

/** Reta: posição implica ~kmhHaversine; chip reporta kmhChip. */
const retaComChip = (
  n: number,
  kmhHav: number,
  kmhChip: number,
): PontoGps[] => {
  const metrosPorFix = (kmhHav / 3.6) * 2;
  return Array.from({ length: n }, (_, i) => ({
    lat: graus(i * metrosPorFix),
    lng: 0,
    t: t0 + i * 2000,
    speed: kmhChip / 3.6,
    accuracy: 8,
  }));
};

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

describe("codificarVelocidades / decodificarVelocidades", () => {
  it("ida e volta em décimos de km/h", () => {
    const valores = [0, 19.8, 87.3, 120, 40.1];
    expect(decodificarVelocidades(codificarVelocidades(valores))).toEqual(valores);
  });

  it("string vazia vira lista vazia", () => {
    expect(decodificarVelocidades("")).toEqual([]);
  });
});

describe("simplificarTracado", () => {
  it("reduz uma reta aos extremos", () => {
    const pontos = reta(50).map(({ lat, lng }) => ({ lat, lng }));
    const simples = simplificarTracado(pontos, 8);
    expect(simples).toEqual([pontos[0], pontos[49]]);
  });

  it("mantém a quina de uma curva em L e a velocidade do vértice", () => {
    const ida = Array.from({ length: 20 }, (_, i) => ({
      lat: -27.6 + i * 0.0001,
      lng: -48.5,
      velocidadeKmh: 20 + i,
    }));
    const volta = Array.from({ length: 20 }, (_, i) => ({
      lat: -27.6 + 19 * 0.0001,
      lng: -48.5 + (i + 1) * 0.0001,
      velocidadeKmh: 40 + i,
    }));
    const simples = simplificarTracado([...ida, ...volta], 8);
    expect(simples).toHaveLength(3);
    expect(simples[1]).toEqual(ida[19]);
  });

  it("preserva índice forçado no meio de uma reta", () => {
    const pontos = reta(50).map(({ lat, lng }, i) => ({
      lat,
      lng,
      velocidadeKmh: i === 25 ? 200 : 40,
    }));
    const simples = simplificarTracado(pontos, 8, [25]);
    expect(simples).toHaveLength(3);
    expect(simples[1]).toEqual(pontos[25]);
  });
});

describe("pontosDoTracado", () => {
  it("descarta fix impreciso e salto impossível", () => {
    const base = reta(5);
    const ruins: PontoGps[] = [
      { lat: -27.7, lng: -48.6, t: t0 + 2500, speed: null, accuracy: 180 },
      { lat: -26.0, lng: -48.5, t: t0 + 4500, speed: null, accuracy: 5 },
    ];
    const aceitos = pontosDoTracado([...base, ...ruins]);
    expect(aceitos).toHaveLength(5);
    expect(aceitos.every((p) => p.lat < -27.5)).toBe(true);
    expect(aceitos.every((p) => typeof p.velocidadeKmh === "number")).toBe(true);
  });

  it("mantém fix de 65 m no caminho (GPS do iPhone)", () => {
    const base = reta(2);
    const noCaminho: PontoGps = {
      lat: base[0].lat + 0.00005,
      lng: base[0].lng,
      t: base[0].t + 2000,
      speed: 5.5,
      accuracy: 65,
    };
    const aceitos = pontosDoTracado([base[0], noCaminho]);
    expect(aceitos).toHaveLength(2);
    expect(aceitos[1]).toMatchObject({ lat: noCaminho.lat, lng: noCaminho.lng });
  });
});

describe("gerarTracado", () => {
  it("devolve vazio sem pontos suficientes", () => {
    expect(gerarTracado([])).toEqual({ polyline: "", velocidades: "" });
    expect(gerarTracado(reta(1))).toEqual({ polyline: "", velocidades: "" });
  });

  it("alinha velocidades aos vértices do polyline", () => {
    const gerado = gerarTracado(reta(20));
    const pontos = decodificarPolyline(gerado.polyline);
    const velocidades = decodificarVelocidades(gerado.velocidades);
    expect(pontos.length).toBeGreaterThanOrEqual(2);
    expect(velocidades).toHaveLength(pontos.length);
    expect(velocidades.every((v) => v >= 0)).toBe(true);
  });

  it("respeita o teto de pontos em passeio longo e sinuoso", () => {
    const zigueZague: PontoGps[] = Array.from({ length: 8000 }, (_, i) => ({
      lat: -27.6 + i * 0.0001,
      lng: -48.5 + (i % 2) * 0.0003,
      t: t0 + i * 2000,
      speed: 10,
      accuracy: 5,
    }));
    const gerado = gerarTracado(zigueZague);
    const pontos = decodificarPolyline(gerado.polyline);
    const velocidades = decodificarVelocidades(gerado.velocidades);
    expect(pontos.length).toBeGreaterThanOrEqual(2);
    expect(pontos.length).toBeLessThanOrEqual(MAX_PONTOS_TRACADO);
    expect(velocidades).toHaveLength(pontos.length);
    expect(gerado.polyline.length).toBeLessThanOrEqual(20_000);
    expect(gerado.velocidades.length).toBeLessThanOrEqual(20_000);
  });

  it("alinha o pico do traçado à máxima da sessão quando o chip discorda da haversine", () => {
    // Mesmo padrão do sintoma 207 vs ~149: chip fora da margem do trecho.
    const pontos = retaComChip(16, 149, 207);
    const metrica = processarPontos(pontos).velocidadeMaxKmh;
    expect(metrica).toBeGreaterThan(180);

    const gerado = gerarTracado(pontos);
    const velocidades = decodificarVelocidades(gerado.velocidades);
    const maxTracado = Math.max(...velocidades);
    const picoArredondado = Math.round(metrica * 10) / 10;

    expect(maxTracado).toBeCloseTo(picoArredondado, 1);
    expect(velocidades[indiceVelocidadeMaxima(velocidades)]).toBeCloseTo(
      picoArredondado,
      1,
    );
  });

  it("mantém o pico da máxima no meio de uma reta após o simplify", () => {
    let acum = 0;
    const pontos: PontoGps[] = Array.from({ length: 30 }, (_, i) => {
      const kmh = i >= 12 && i <= 14 ? 120 : 80;
      const metros = i === 0 ? 0 : (kmh / 3.6) * 2;
      acum += metros;
      return {
        lat: graus(acum),
        lng: 0,
        t: t0 + i * 2000,
        speed: kmh / 3.6,
        accuracy: 5,
      };
    });
    const metrica = processarPontos(pontos).velocidadeMaxKmh;
    expect(metrica).toBeGreaterThan(100);

    const gerado = gerarTracado(pontos);
    const trajeto = decodificarPolyline(gerado.polyline);
    const velocidades = decodificarVelocidades(gerado.velocidades);
    expect(trajeto.length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...velocidades)).toBeCloseTo(Math.round(metrica * 10) / 10, 1);
  });
});

describe("indiceVerticeMaisProximo", () => {
  it("escolhe o vértice mais perto do toque", () => {
    const pontos = [
      { lat: -27.6, lng: -48.5 },
      { lat: -27.61, lng: -48.5 },
      { lat: -27.62, lng: -48.5 },
    ];
    expect(indiceVerticeMaisProximo(pontos, { lat: -27.609, lng: -48.5 })).toBe(1);
    expect(indiceVerticeMaisProximo([], { lat: 0, lng: 0 })).toBe(-1);
  });
});
