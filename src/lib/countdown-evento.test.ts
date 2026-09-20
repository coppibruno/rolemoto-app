import { describe, expect, it } from "vitest";
import { eventoEncerrado, labelCountdownEvento } from "./countdown-evento";

const agora = Date.parse("2026-09-20T12:00:00.000Z");

describe("countdown-evento", () => {
  it("marca encerrado após o limite", () => {
    expect(
      eventoEncerrado("2026-09-19T20:00:00.000Z", null, agora),
    ).toBe(true);
    expect(labelCountdownEvento("2026-09-19T20:00:00.000Z", null, agora)).toBe(
      "Encerrado",
    );
  });

  it("usa encerramento quando existe", () => {
    expect(
      eventoEncerrado(
        "2026-09-20T10:00:00.000Z",
        "2026-09-20T18:00:00.000Z",
        agora,
      ),
    ).toBe(false);
    expect(
      labelCountdownEvento(
        "2026-09-20T10:00:00.000Z",
        "2026-09-20T18:00:00.000Z",
        agora,
      ),
    ).toBe("Hoje");
  });

  it("formata dias, horas e começa em breve", () => {
    expect(
      labelCountdownEvento("2026-09-23T12:00:00.000Z", null, agora),
    ).toBe("Faltam 3 dias");
    expect(
      labelCountdownEvento("2026-09-20T16:00:00.000Z", null, agora),
    ).toBe("Faltam 4 h");
    expect(
      labelCountdownEvento("2026-09-20T12:20:00.000Z", null, agora),
    ).toBe("Começa em breve");
  });
});
