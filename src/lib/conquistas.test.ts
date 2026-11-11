import { describe, expect, it } from "vitest";
import { formatarVelocidadeConquista, fraseConquista } from "./conquistas";

describe("formatarVelocidadeConquista", () => {
  it("inteiro sem casa decimal; decimal com vírgula", () => {
    expect(formatarVelocidadeConquista(72)).toBe("72 km/h");
    expect(formatarVelocidadeConquista(72.5)).toBe("72,5 km/h");
    expect(formatarVelocidadeConquista(72.04)).toBe("72 km/h");
    expect(formatarVelocidadeConquista(0)).toBe("0 km/h");
  });
});

describe("fraseConquista", () => {
  it("primeira vez e recorde", () => {
    const base = { id: "a", nome: "Morro da Igreja", velocidadeMaxKmh: 48.3 };
    expect(fraseConquista({ ...base, novidade: "primeira" })).toBe(
      "Você conquistou Morro da Igreja",
    );
    expect(fraseConquista({ ...base, novidade: "recorde" })).toBe(
      "Recorde em Morro da Igreja: 48,3 km/h",
    );
  });
});
