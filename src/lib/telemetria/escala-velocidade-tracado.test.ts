import { describe, expect, it } from "vitest";
import {
  LIMIAR_PARADO_KMH,
  LIMIAR_VARIACAO_KMH,
  corVelocidadeRelativa,
  escalaVelocidadeTracado,
} from "./escala-velocidade-tracado";

describe("corVelocidadeRelativa", () => {
  it("extremo frio é ciano do marcador A", () => {
    expect(corVelocidadeRelativa(0)).toBe("#38bdf8");
  });

  it("extremo quente é laranja do marcador B", () => {
    expect(corVelocidadeRelativa(1)).toBe("#f97316");
  });
});

describe("escalaVelocidadeTracado", () => {
  it("devolve null com menos de 2 vértices", () => {
    expect(escalaVelocidadeTracado([])).toBeNull();
    expect(escalaVelocidadeTracado([40])).toBeNull();
  });

  it("devolve null se quase tudo está abaixo do limiar de parado", () => {
    expect(
      escalaVelocidadeTracado([0, 1, 2, LIMIAR_PARADO_KMH - 0.1]),
    ).toBeNull();
  });

  it("devolve null se a variação útil é irrisória", () => {
    const base = 40;
    expect(
      escalaVelocidadeTracado([
        base,
        base + LIMIAR_VARIACAO_KMH - 0.5,
        base,
      ]),
    ).toBeNull();
  });

  it("ignora parado no domínio e pinta esses segmentos no frio", () => {
    const escala = escalaVelocidadeTracado([0, 20, 80, 20]);
    expect(escala).not.toBeNull();
    expect(escala!.minKmh).toBe(20);
    expect(escala!.maxKmh).toBe(80);
    expect(escala!.coresSegmentos).toHaveLength(3);
    expect(escala!.coresSegmentos[0]).toBe(corVelocidadeRelativa(0));
  });

  it("contrasta lento e rápido no mesmo passeio", () => {
    const escala = escalaVelocidadeTracado([10, 10, 100, 100]);
    expect(escala).not.toBeNull();
    expect(escala!.coresSegmentos[0]).toBe(corVelocidadeRelativa(0));
    expect(escala!.coresSegmentos[2]).toBe(corVelocidadeRelativa(1));
  });
});
