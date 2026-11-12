import {describe, expect, it} from "vitest";
import type {OfertaLocal} from "../types/oferta-local";
import {
  inicioSemanaSaoPaulo,
  ofertaDoCard,
  ofertaVigente,
  paraOfertaCliente,
  rotuloOferta,
  validarOferta,
} from "./oferta-local";

const base = {
  titulo: "Combo do piloto",
  tipo: "preco",
  valor: 32,
  codigo: "moto10",
  regra: "Válido no café com pão de queijo",
  tetoDia: 20,
  dias: [3],
  horaInicio: "14:00",
  horaFim: "17:00",
};

const erroDe = (patch: Record<string, unknown>): string | null => {
  const r = validarOferta({...base, ...patch});
  return r.ok ? null : r.erro;
};

/** Quarta, 11/11/2026, no relógio de São Paulo (UTC−3). */
const quartaSp = (hora: string): Date => new Date(`2026-11-11T${hora}:00-03:00`);

const oferta = (patch: Partial<OfertaLocal> = {}): OfertaLocal => ({
  id: "o1",
  localId: "l1",
  titulo: "Combo",
  tipo: "preco",
  valor: 32,
  codigo: "MOTO10",
  regra: "regra",
  tetoDia: null,
  dias: [],
  horaInicio: null,
  horaFim: null,
  ativa: true,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  ...patch,
});

describe("VP1 — validarOferta", () => {
  it("aceita preço e normaliza o código", () => {
    const r = validarOferta({...base, codigo: " mo to10 "});
    expect(r.ok && r.dados).toMatchObject({codigo: "MOTO10", valor: 32, dias: [3]});
  });

  it("título", () => {
    expect(erroDe({titulo: "  "})).toBe("Dê um nome de até 60 caracteres");
    expect(erroDe({titulo: "x".repeat(61)})).toBe("Dê um nome de até 60 caracteres");
  });

  it("tipo", () => {
    expect(erroDe({tipo: "combo"})).toBe("tipo inválido");
  });

  it("preço", () => {
    expect(erroDe({valor: 0})).toBe("Informe o preço");
    expect(erroDe({valor: null})).toBe("Informe o preço");
    expect(erroDe({valor: 100000})).toBe("Informe o preço");
    expect(erroDe({valor: 10.123})).toBe("Informe o preço");
    expect(erroDe({valor: 99999.99})).toBeNull();
    expect(erroDe({valor: 32.5})).toBeNull();
  });

  it("percentual", () => {
    expect(erroDe({tipo: "percentual", valor: 0})).toBe("Informe o percentual de 1 a 100");
    expect(erroDe({tipo: "percentual", valor: 10.5})).toBe("Informe o percentual de 1 a 100");
    expect(erroDe({tipo: "percentual", valor: 101})).toBe("Informe o percentual de 1 a 100");
    expect(erroDe({tipo: "percentual", valor: 10})).toBeNull();
  });

  it("brinde", () => {
    expect(erroDe({tipo: "brinde", valor: 5})).toBe("Brinde não leva valor");
    const r = validarOferta({...base, tipo: "brinde", valor: null});
    expect(r.ok && r.dados.valor).toBeNull();
  });

  it("código", () => {
    expect(erroDe({codigo: "abc"})).toBe("O código tem de 4 a 8 letras ou números");
    expect(erroDe({codigo: "ABCDEFGHI"})).toBe("O código tem de 4 a 8 letras ou números");
    expect(erroDe({codigo: "AB-12"})).toBe("O código tem de 4 a 8 letras ou números");
  });

  it("regra", () => {
    expect(erroDe({regra: ""})).toBe("Escreva a regra em até 280 caracteres");
    expect(erroDe({regra: "x".repeat(281)})).toBe("Escreva a regra em até 280 caracteres");
  });

  it("teto por dia", () => {
    expect(erroDe({tetoDia: 0})).toBe("O teto por dia é de 1 a 999");
    expect(erroDe({tetoDia: 1000})).toBe("O teto por dia é de 1 a 999");
    expect(erroDe({tetoDia: 2.5})).toBe("O teto por dia é de 1 a 999");
    const r = validarOferta({...base, tetoDia: null});
    expect(r.ok && r.dados.tetoDia).toBeNull();
  });

  it("dias", () => {
    expect(erroDe({dias: [7]})).toBe("Dia inválido");
    expect(erroDe({dias: [1, 1]})).toBe("Dia inválido");
    const r = validarOferta({...base, dias: [5, 1]});
    expect(r.ok && r.dados.dias).toEqual([1, 5]);
  });

  it("faixa de hora", () => {
    expect(erroDe({horaFim: null})).toBe("Informe início e fim, ou deixe os dois vazios");
    expect(erroDe({horaInicio: "25:00"})).toBe("Horário inválido");
    expect(erroDe({horaFim: "14:00"})).toBe("O fim precisa ser depois do início");
    expect(erroDe({horaInicio: "22:00", horaFim: "02:00"})).toBe(
      "O fim precisa ser depois do início",
    );
    const r = validarOferta({...base, horaInicio: null, horaFim: null});
    expect(r.ok && [r.dados.horaInicio, r.dados.horaFim]).toEqual([null, null]);
  });

  it("devolve a primeira falha da tabela", () => {
    expect(erroDe({titulo: "", tipo: "x", codigo: "a"})).toBe("Dê um nome de até 60 caracteres");
  });
});

describe("VP1 — vigência e rótulo", () => {
  const quarta = oferta({dias: [3], horaInicio: "14:00", horaFim: "17:00"});

  it("vale dentro do dia e da faixa", () => {
    expect(ofertaVigente(quarta, quartaSp("14:00"))).toBe(true);
    expect(ofertaVigente(quarta, quartaSp("16:59"))).toBe(true);
  });

  it("fora do horário não está vigente", () => {
    expect(ofertaVigente(quarta, quartaSp("13:59"))).toBe(false);
    expect(ofertaVigente(quarta, quartaSp("17:00"))).toBe(false);
  });

  it("fora do dia não está vigente", () => {
    expect(ofertaVigente(quarta, new Date("2026-11-12T15:00:00-03:00"))).toBe(false);
  });

  it("usa o relógio de São Paulo, não o UTC", () => {
    const qualquerDia = oferta({horaInicio: "20:00", horaFim: "23:00"});
    expect(ofertaVigente(qualquerDia, new Date("2026-11-12T00:30:00Z"))).toBe(true);
  });

  it("pausada nunca está vigente", () => {
    expect(ofertaVigente(oferta({ativa: false}), quartaSp("12:00"))).toBe(false);
  });

  it("dias vazios e faixa nula valem o dia todo", () => {
    expect(ofertaVigente(oferta(), quartaSp("00:00"))).toBe(true);
    expect(ofertaVigente(oferta(), quartaSp("23:59"))).toBe(true);
  });

  it("entre duas vigentes, o card mostra a de updatedAt maior", () => {
    const antiga = oferta({id: "a", updatedAt: "2026-11-01T00:00:00.000Z"});
    const nova = oferta({id: "b", updatedAt: "2026-11-05T00:00:00.000Z"});
    const pausada = oferta({id: "c", ativa: false, updatedAt: "2026-11-09T00:00:00.000Z"});
    expect(ofertaDoCard([antiga, nova, pausada], quartaSp("10:00"))?.id).toBe("b");
    expect(ofertaDoCard([pausada], quartaSp("10:00"))).toBeNull();
  });

  it("rótulos", () => {
    expect(rotuloOferta("preco", 32)).toBe("R$ 32");
    expect(rotuloOferta("preco", 32.5)).toBe("R$ 32,50");
    expect(rotuloOferta("percentual", 10)).toBe("10%");
    expect(rotuloOferta("brinde", null)).toBe("BRINDE");
  });

  it("piloto não recebe o código fora da janela; dono recebe sempre", () => {
    const fora = quartaSp("09:00");
    expect(paraOfertaCliente(quarta, fora, false).codigo).toBeNull();
    expect(paraOfertaCliente(quarta, fora, true).codigo).toBe("MOTO10");
    expect(paraOfertaCliente(quarta, quartaSp("15:00"), false)).toMatchObject({
      codigo: "MOTO10",
      vigente: true,
      rotulo: "R$ 32",
    });
  });

  it("a semana começa na segunda 00:00 de São Paulo", () => {
    expect(inicioSemanaSaoPaulo(quartaSp("15:00")).toISOString()).toBe(
      "2026-11-09T03:00:00.000Z",
    );
    expect(inicioSemanaSaoPaulo(new Date("2026-11-16T02:00:00Z")).toISOString()).toBe(
      "2026-11-09T03:00:00.000Z",
    );
    expect(inicioSemanaSaoPaulo(new Date("2026-11-09T03:00:00Z")).toISOString()).toBe(
      "2026-11-09T03:00:00.000Z",
    );
  });
});
