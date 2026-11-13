import { describe, expect, it } from "vitest";
import {
  formatarDataExtenso,
} from "@/app/(app)/eventos/[id]/formatar-data-evento";
import { formatarDataEventoCapa } from "@/app/(app)/meus-roles/formatar-meus-roles";
import {
  formatarFaixaHero,
  formatarHorarioEvento,
  formatarHorarioSaida,
} from "./formatar-horario";

/** Quarta-feira, 18/11/2026, 14:30 em São Paulo. */
const QUARTA = "2026-11-18T17:30:00.000Z";

describe("data com dia da semana", () => {
  it("mostra o dia do mês no rolê", () => {
    expect(formatarHorarioSaida(QUARTA)).toBe("Quarta-feira, 18/11 · 14:30");
    expect(formatarFaixaHero(QUARTA)).toBe(
      "Quarta-feira, 18/11 • Encontro às 14:30h",
    );
  });

  it("mostra o dia do mês no evento", () => {
    expect(formatarHorarioEvento(QUARTA)).toBe("Quarta-feira, 18/11 às 14:30");
    expect(formatarDataExtenso(QUARTA)).toBe("Quarta-feira, 18/11");
    expect(formatarDataEventoCapa(QUARTA)).toBe("Quarta-feira, 18/11");
  });

  it("hoje e amanhã também levam a data", () => {
    const agora = new Date();
    expect(formatarHorarioSaida(agora.toISOString())).toMatch(
      /^Hoje, \d{2}\/\d{2} · \d{2}:\d{2}$/,
    );
    expect(formatarHorarioEvento(agora.toISOString())).toMatch(
      /^Hoje, \d{2}\/\d{2} às \d{2}:\d{2}$/,
    );
  });
});
