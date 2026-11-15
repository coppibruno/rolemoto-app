import {describe, expect, it} from "vitest";
import {codigoAfiliado, nomeAfiliado} from "./afiliado";

describe("codigoAfiliado", () => {
  it("aceita 3..20 com a-z, 0-9 e hífen", () => {
    expect(codigoAfiliado("joao-moto")).toBe("joao-moto");
    expect(codigoAfiliado("abc")).toBe("abc");
    expect(codigoAfiliado("a".repeat(20))).toBe("a".repeat(20));
    expect(codigoAfiliado(" rider22 ")).toBe("rider22");
  });

  it("recusa maiúscula, acento, curto, longo e tipo errado", () => {
    expect(codigoAfiliado("Joao")).toBeNull();
    expect(codigoAfiliado("joão")).toBeNull();
    expect(codigoAfiliado("ab")).toBeNull();
    expect(codigoAfiliado("a".repeat(21))).toBeNull();
    expect(codigoAfiliado("a_b_c")).toBeNull();
    expect(codigoAfiliado(123)).toBeNull();
    expect(codigoAfiliado(undefined)).toBeNull();
  });
});

describe("nomeAfiliado", () => {
  it("aceita 1..60", () => {
    expect(nomeAfiliado(" Ana ")).toBe("Ana");
    expect(nomeAfiliado("x".repeat(60))).toBe("x".repeat(60));
  });

  it("recusa vazio e acima de 60", () => {
    expect(nomeAfiliado("  ")).toBeNull();
    expect(nomeAfiliado("x".repeat(61))).toBeNull();
    expect(nomeAfiliado(null)).toBeNull();
  });
});
