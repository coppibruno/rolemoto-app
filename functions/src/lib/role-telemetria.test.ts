import {describe, expect, it} from "vitest";
import {parseAmostrasConquista} from "./role-telemetria";

const ponto = (t: number) => ({lat: -28.4, lng: -49.5, t, speed: 10, accuracy: 5});

describe("parseAmostrasConquista", () => {
  it("corta em 6 amostras e 120 pontos", () => {
    const amostras = Array.from({length: 8}, (_, i) => ({
      conquistaId: `c${i}`,
      pontos: Array.from({length: 150}, (_, t) => ponto(t)),
    }));
    const lidas = parseAmostrasConquista(amostras);
    expect(lidas).toHaveLength(6);
    expect(lidas.every((a) => a.pontos.length === 120)).toBe(true);
  });

  it("provider longo vira null; speed e accuracy fora de tipo viram null", () => {
    const [amostra] = parseAmostrasConquista([{
      conquistaId: "x",
      pontos: [
        {...ponto(1), provider: "gps"},
        {...ponto(2), provider: "p".repeat(17), speed: "rápido", accuracy: {}},
      ],
    }]);
    expect(amostra.pontos[0].provider).toBe("gps");
    expect(amostra.pontos[1]).toMatchObject({provider: null, speed: null, accuracy: null});
  });

  it("ignora amostra que não é objeto e ponto sem t numérico", () => {
    const lidas = parseAmostrasConquista([
      null,
      "x",
      {conquistaId: "", pontos: []},
      {conquistaId: "ok", pontos: [{lat: 1, lng: 1, t: "agora"}, ponto(3)]},
    ]);
    expect(lidas).toEqual([{conquistaId: "ok", pontos: [{...ponto(3), provider: null}]}]);
  });

  it("valor que não é lista vira []", () => {
    expect(parseAmostrasConquista(undefined)).toEqual([]);
    expect(parseAmostrasConquista({conquistaId: "x"})).toEqual([]);
  });
});
