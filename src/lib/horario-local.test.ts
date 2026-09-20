import { describe, expect, it } from "vitest";
import type { HorarioDiaLocal } from "@/types/local";
import {
  agruparHorarios,
  estaAbertoAgora,
  formatarHorarioLocal,
  labelStatusAberto,
} from "./horario-local";

const dia = (
  valor: HorarioDiaLocal["dia"],
  abertura: string,
  fechamento: string,
): HorarioDiaLocal => ({
  dia: valor,
  fechado: false,
  abertura,
  fechamento,
});

const fechado = (valor: HorarioDiaLocal["dia"]): HorarioDiaLocal => ({
  dia: valor,
  fechado: true,
  abertura: null,
  fechamento: null,
});

const semanaUtil = (): HorarioDiaLocal[] => [
  fechado(0),
  dia(1, "08:00", "18:00"),
  dia(2, "08:00", "18:00"),
  dia(3, "08:00", "18:00"),
  dia(4, "08:00", "18:00"),
  dia(5, "08:00", "18:00"),
  dia(6, "09:00", "13:00"),
];

describe("horario-local", () => {
  it("agrupa dias consecutivos com a mesma faixa", () => {
    const grupos = agruparHorarios(semanaUtil());
    expect(grupos).toHaveLength(3);
    expect(grupos[0]).toMatchObject({
      inicio: { curto: "Seg" },
      fim: { curto: "Sex" },
      abertura: "08:00",
      fechamento: "18:00",
    });
    expect(grupos[1]).toMatchObject({
      inicio: { curto: "Sáb" },
      fim: { curto: "Sáb" },
      abertura: "09:00",
    });
    expect(grupos[2].fechado).toBe(true);
  });

  it("formata 24h e grupos em texto", () => {
    expect(formatarHorarioLocal({ aberto24h: true, horarios: [] })).toBe(
      "Aberto 24 horas",
    );
    expect(
      formatarHorarioLocal({ aberto24h: false, horarios: semanaUtil() }),
    ).toContain("Seg–Sex 08:00–18:00");
  });

  it("detecta aberto agora no intervalo do dia", () => {
    const local = { aberto24h: false, horarios: semanaUtil() };
    const quartaManha = new Date(2026, 8, 16, 10, 0);
    const quartaNoite = new Date(2026, 8, 16, 20, 0);
    const domingo = new Date(2026, 8, 20, 10, 0);
    expect(estaAbertoAgora(local, quartaManha)).toBe(true);
    expect(estaAbertoAgora(local, quartaNoite)).toBe(false);
    expect(estaAbertoAgora(local, domingo)).toBe(false);
    expect(labelStatusAberto(local, quartaManha)).toBe("Aberto agora");
    expect(labelStatusAberto(local, domingo)).toBe("Fechado");
  });

  it("suporta faixa que vira a noite", () => {
    const local = {
      aberto24h: false,
      horarios: [dia(6, "22:00", "02:00")],
    };
    expect(estaAbertoAgora(local, new Date(2026, 8, 19, 23, 30))).toBe(true);
    expect(estaAbertoAgora(local, new Date(2026, 8, 19, 1, 30))).toBe(true);
    expect(estaAbertoAgora(local, new Date(2026, 8, 19, 10, 0))).toBe(false);
  });

  it("marca 24 horas sem consultar o relógio", () => {
    expect(
      estaAbertoAgora({ aberto24h: true, horarios: [] }, new Date(2026, 8, 20, 3)),
    ).toBe(true);
    expect(labelStatusAberto({ aberto24h: true, horarios: [] })).toBe("24 horas");
  });
});
