import { describe, expect, it } from "vitest";
import { faixaOcultaHoje, ocultarFaixaHoje, ymdSaoPauloAgora } from "./faixa-sugestao";

const memoria = () => {
  const dados = new Map<string, string>();
  return {
    getItem: (chave: string) => dados.get(chave) ?? null,
    setItem: (chave: string, valor: string) => {
      dados.set(chave, valor);
    },
  };
};

describe("faixa do Início", () => {
  it("esconde só até o fim do dia em São Paulo", () => {
    const storage = memoria();
    const hoje = "2026-11-16";
    expect(faixaOcultaHoje(hoje, storage)).toBe(false);
    ocultarFaixaHoje(hoje, storage);
    expect(faixaOcultaHoje(hoje, storage)).toBe(true);
    expect(faixaOcultaHoje("2026-11-17", storage)).toBe(false);
  });

  it("formata o dia no fuso de São Paulo", () => {
    expect(ymdSaoPauloAgora(new Date("2026-11-16T02:30:00.000Z"))).toBe("2026-11-15");
    expect(ymdSaoPauloAgora(new Date("2026-11-16T15:00:00.000Z"))).toBe("2026-11-16");
  });
});