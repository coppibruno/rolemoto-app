import { describe, expect, it } from "vitest";
import {
  campoDoErroOferta,
  escreverValorOferta,
  janelaCurtaOferta,
  janelaLongaOferta,
  lerValorOferta,
} from "./oferta-local";

const janela = (patch: Record<string, unknown> = {}) => ({
  dias: [] as number[],
  horaInicio: null as string | null,
  horaFim: null as string | null,
  tetoDia: null as number | null,
  ...patch,
});

describe("janelaCurtaOferta", () => {
  it("hora de fim, teto e o dia todo", () => {
    expect(janelaCurtaOferta(janela({ horaInicio: "14:00", horaFim: "17:00" }))).toBe("até 17h");
    expect(janelaCurtaOferta(janela({ horaInicio: "14:00", horaFim: "17:30" }))).toBe(
      "até 17h30",
    );
    expect(janelaCurtaOferta(janela({ tetoDia: 20 }))).toBe("até 20 por dia");
    expect(
      janelaCurtaOferta(janela({ horaInicio: "08:00", horaFim: "17:00", tetoDia: 20 })),
    ).toBe("até 17h · até 20 por dia");
    expect(janelaCurtaOferta(janela())).toBe("hoje");
  });
});

describe("janelaLongaOferta", () => {
  it("segue os exemplos da spec", () => {
    expect(janelaLongaOferta(janela({ dias: [3], horaInicio: "14:00", horaFim: "17:00" }))).toBe(
      "Quarta · 14:00–17:00",
    );
    expect(janelaLongaOferta(janela())).toBe("Todo dia");
    expect(janelaLongaOferta(janela({ dias: [1, 2, 3, 4, 5] }))).toBe("Seg–sex · o dia todo");
  });

  it("dias soltos e faixa sem dia", () => {
    expect(janelaLongaOferta(janela({ dias: [6, 0] }))).toBe("Dom, Sáb · o dia todo");
    expect(janelaLongaOferta(janela({ horaInicio: "18:00", horaFim: "22:00" }))).toBe(
      "Todo dia · 18:00–22:00",
    );
  });
});

describe("valor do formulário", () => {
  it("lê vírgula e escreve sem centavos quando inteiro", () => {
    expect(lerValorOferta("32,50")).toBe(32.5);
    expect(lerValorOferta("R$ 32")).toBe(32);
    expect(lerValorOferta("")).toBeNull();
    expect(lerValorOferta("abc")).toBeNull();
    expect(escreverValorOferta("preco", 32.5)).toBe("32,50");
    expect(escreverValorOferta("preco", 32)).toBe("32");
    expect(escreverValorOferta("percentual", 10)).toBe("10");
    expect(escreverValorOferta("brinde", null)).toBe("");
  });
});

describe("campoDoErroOferta", () => {
  it("liga as mensagens da API aos campos", () => {
    expect(campoDoErroOferta("Dê um nome de até 60 caracteres")).toBe("titulo");
    expect(campoDoErroOferta("Informe o preço")).toBe("valor");
    expect(campoDoErroOferta("Brinde não leva valor")).toBe("valor");
    expect(campoDoErroOferta("Já existe uma oferta com esse código neste local")).toBe("codigo");
    expect(campoDoErroOferta("O código tem de 4 a 8 letras ou números")).toBe("codigo");
    expect(campoDoErroOferta("Escreva a regra em até 280 caracteres")).toBe("regra");
    expect(campoDoErroOferta("O teto por dia é de 1 a 999")).toBe("tetoDia");
    expect(campoDoErroOferta("Dia inválido")).toBe("dias");
    expect(campoDoErroOferta("O fim precisa ser depois do início")).toBe("faixa");
    expect(campoDoErroOferta("Este local já tem 5 ofertas")).toBe("geral");
  });
});
