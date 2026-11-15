import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cliqueJaContadoHoje,
  codigoAfiliadoValido,
  guardarCodigoAfiliado,
  limparCodigoAfiliado,
  marcarCliqueHoje,
  normalizarCodigoAfiliado,
} from "./afiliado";

const DIA = 24 * 60 * 60 * 1000;

const memoria = new Map<string, string>();
vi.stubGlobal("window", {
  localStorage: {
    getItem: (chave: string) => memoria.get(chave) ?? null,
    setItem: (chave: string, valor: string) => memoria.set(chave, valor),
    removeItem: (chave: string) => memoria.delete(chave),
  },
});

describe("afiliado no client", () => {
  beforeEach(() => memoria.clear());

  it("normaliza e recusa formato inválido", () => {
    expect(normalizarCodigoAfiliado(" Joao-Moto ")).toBe("joao-moto");
    expect(normalizarCodigoAfiliado("ab")).toBeNull();
    expect(normalizarCodigoAfiliado("com espaço")).toBeNull();
  });

  it("vale por 30 dias e some ao limpar", () => {
    const agora = Date.now();
    guardarCodigoAfiliado("joao", agora);
    expect(codigoAfiliadoValido(agora + 29 * DIA)).toBe("joao");
    expect(codigoAfiliadoValido(agora + 31 * DIA)).toBeNull();
    limparCodigoAfiliado();
    expect(codigoAfiliadoValido(agora)).toBeNull();
  });

  it("clique conta uma vez por dia por código", () => {
    const agora = new Date(2026, 10, 15, 10).getTime();
    expect(cliqueJaContadoHoje("joao", agora)).toBe(false);
    marcarCliqueHoje("joao", agora);
    expect(cliqueJaContadoHoje("joao", agora + 60_000)).toBe(true);
    expect(cliqueJaContadoHoje("maria", agora)).toBe(false);
    expect(cliqueJaContadoHoje("joao", agora + DIA)).toBe(false);
  });
});
