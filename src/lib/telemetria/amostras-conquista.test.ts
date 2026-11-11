import { describe, expect, it } from "vitest";
import type { ConquistaCatalogo } from "@/types/conquista";
import type { PontoGps } from "./calcular-metricas";
import {
  MAX_AMOSTRAS,
  MAX_PONTOS_AMOSTRA,
  montarAmostrasConquista,
  reduzirAmostra,
} from "./amostras-conquista";

const METROS_POR_GRAU = (6371 * 1000 * Math.PI) / 180;
const t0 = Date.parse("2026-11-11T13:00:00.000Z");

const pino = (id: string, lat: number, raioMetros = 500): ConquistaCatalogo => ({
  id,
  nome: id,
  lat,
  lng: -49.5,
  raioMetros,
});

/** Pontos a cada 2 s, para o norte, a partir de `lat`. */
const andar = (
  lat: number,
  quantidade: number,
  opcoes: { inicioMs?: number; passoM?: number; accuracy?: number | null } = {},
): PontoGps[] =>
  Array.from({ length: quantidade }, (_, i) => ({
    lat: lat + (i * (opcoes.passoM ?? 20)) / METROS_POR_GRAU,
    lng: -49.5,
    t: (opcoes.inicioMs ?? t0) + i * 2000,
    speed: (opcoes.passoM ?? 20) / 2,
    accuracy: opcoes.accuracy === undefined ? 5 : opcoes.accuracy,
  }));

describe("montarAmostrasConquista", () => {
  it("corta só os pontos dentro do círculo", () => {
    const alvo = pino("a", -28.4, 150);
    const pontos = andar(-28.4 - 300 / METROS_POR_GRAU, 31);
    const [amostra] = montarAmostrasConquista(pontos, [alvo]);
    expect(amostra.conquistaId).toBe("a");
    expect(amostra.pontos.length).toBeGreaterThan(10);
    expect(amostra.pontos.length).toBeLessThan(pontos.length);
  });

  it("reduz um trecho longo a no máximo 120 pontos, em ordem de tempo", () => {
    const alvo = pino("a", -28.4, 2000);
    const pontos = andar(-28.4, 400, { passoM: 5 });
    const [amostra] = montarAmostrasConquista(pontos, [alvo]);
    expect(amostra.pontos).toHaveLength(MAX_PONTOS_AMOSTRA);
    const tempos = amostra.pontos.map((p) => p.t);
    expect(tempos).toEqual([...tempos].sort((a, b) => a - b));
  });

  it("cada balde fica com o ponto de maior speed; nulo conta como −1", () => {
    const base = andar(-28.4, 240, { passoM: 5 });
    base[0] = { ...base[0], speed: null };
    base[1] = { ...base[1], speed: 9 };
    const reduzidos = reduzirAmostra(base);
    expect(reduzidos).toHaveLength(MAX_PONTOS_AMOSTRA);
    expect(reduzidos[0].speed).toBe(9);
  });

  it("no máximo 6 pinos, os de maior distância aceita", () => {
    const catalogo = Array.from({ length: 8 }, (_, i) => pino(`p${i}`, -28 - i * 0.1, 300));
    const pontos = catalogo.flatMap((p, i) =>
      andar(p.lat, 3 + i, { inicioMs: t0 + i * 600_000 }),
    );
    const amostras = montarAmostrasConquista(pontos, catalogo);
    expect(amostras).toHaveLength(MAX_AMOSTRAS);
    expect(amostras.map((a) => a.conquistaId)).toEqual(["p7", "p6", "p5", "p4", "p3", "p2"]);
  });

  it("ponto com accuracy ausente ou acima de 100 m nem entra", () => {
    const alvo = pino("a", -28.4);
    expect(montarAmostrasConquista(andar(-28.4, 10, { accuracy: null }), [alvo])).toEqual([]);
    expect(montarAmostrasConquista(andar(-28.4, 10, { accuracy: 120 }), [alvo])).toEqual([]);
    const misto = andar(-28.4, 10).map((p, i) => (i % 2 ? { ...p, accuracy: 150 } : p));
    const [amostra] = montarAmostrasConquista(misto, [alvo]);
    expect(amostra.pontos.every((p) => (p.accuracy ?? 999) <= 100)).toBe(true);
  });

  it("buraco de 11 s separa as sequências; fica a de maior distância", () => {
    const alvo = pino("a", -28.4);
    const curta = andar(-28.4, 3);
    const longa = andar(-28.4 + 100 / METROS_POR_GRAU, 6, { inicioMs: t0 + 4000 + 11_000 });
    const [amostra] = montarAmostrasConquista([...curta, ...longa], [alvo]);
    expect(amostra.pontos).toHaveLength(6);
  });

  it("cache vazio gera lista vazia", () => {
    expect(montarAmostrasConquista(andar(-28.4, 10), [])).toEqual([]);
  });
});
