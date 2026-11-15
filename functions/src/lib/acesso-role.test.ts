import {describe, expect, it} from "vitest";
import {parseAcesso, podeUsarModelo} from "./acesso-role";

describe("parseAcesso", () => {
  it("ausente vira aberto", () => {
    expect(parseAcesso(undefined)).toBe("aberto");
    expect(parseAcesso(null)).toBe("aberto");
  });

  it("mantém aberto e fechado", () => {
    expect(parseAcesso("aberto")).toBe("aberto");
    expect(parseAcesso("fechado")).toBe("fechado");
  });

  it("outro valor é inválido", () => {
    expect(parseAcesso("publico")).toBeNull();
    expect(parseAcesso(true)).toBeNull();
  });
});

describe("podeUsarModelo", () => {
  it("o criador clona rolê não fixado", () => {
    expect(podeUsarModelo({criadorId: "eu", fixado: false}, true)).toBe(true);
  });

  it("outro piloto só pega o modelo do fixado", () => {
    expect(podeUsarModelo({criadorId: "eu", fixado: true}, false)).toBe(true);
    expect(podeUsarModelo({criadorId: "eu", fixado: false}, false)).toBe(false);
  });
});
