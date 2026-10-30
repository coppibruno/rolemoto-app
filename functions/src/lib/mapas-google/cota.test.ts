import {describe, expect, it} from "vitest";
import {
  AVISO_MAPAS_GOOGLE,
  LIMITE_MAPAS_GOOGLE,
  aplicarReserva,
  decidirCotaMapa,
  marcoAdministrativo,
  mensagemMarco,
} from "./cota";

describe("decidirCotaMapa", () => {
  it("reserva Google em 7999 e em 8000", () => {
    expect(decidirCotaMapa(7_999)).toEqual({provedor: "google"});
    expect(decidirCotaMapa(AVISO_MAPAS_GOOGLE)).toEqual({provedor: "google"});
    expect(decidirCotaMapa(9_999)).toEqual({provedor: "google"});
  });

  it("devolve o mapa livre ao gravar 10000 e depois do teto", () => {
    expect(decidirCotaMapa(LIMITE_MAPAS_GOOGLE)).toEqual({provedor: "osm"});
    expect(decidirCotaMapa(LIMITE_MAPAS_GOOGLE + 1)).toEqual({provedor: "osm"});
  });
});

describe("marcoAdministrativo", () => {
  it("só dispara no exato 8000 e no exato 10000", () => {
    expect(marcoAdministrativo(7_999)).toBeNull();
    expect(marcoAdministrativo(AVISO_MAPAS_GOOGLE)).toBe("faixa");
    expect(marcoAdministrativo(8_001)).toBeNull();
    expect(marcoAdministrativo(9_999)).toBeNull();
    expect(marcoAdministrativo(LIMITE_MAPAS_GOOGLE)).toBe("limite");
    expect(marcoAdministrativo(LIMITE_MAPAS_GOOGLE + 1)).toBeNull();
  });
});

describe("aplicarReserva", () => {
  it("mês novo zera e a primeira reserva fica em 1", () => {
    const resultado = aplicarReserva(
      {periodo: "2026-09", cargas: LIMITE_MAPAS_GOOGLE},
      "2026-10",
    );
    expect(resultado.estado).toEqual({periodo: "2026-10", cargas: 1});
    expect(resultado.provedor).toBe("google");
    expect(resultado.marco).toBeNull();
    expect(resultado.gravar).toBe(true);
  });

  it("8000 reserva Google e é o único ponto do marco faixa", () => {
    const resultado = aplicarReserva(
      {periodo: "2026-10", cargas: AVISO_MAPAS_GOOGLE - 1},
      "2026-10",
    );
    expect(resultado.estado.cargas).toBe(AVISO_MAPAS_GOOGLE);
    expect(resultado.provedor).toBe("google");
    expect(resultado.marco).toBe("faixa");

    const seguinte = aplicarReserva(resultado.estado, "2026-10");
    expect(seguinte.estado.cargas).toBe(AVISO_MAPAS_GOOGLE + 1);
    expect(seguinte.marco).toBeNull();
    expect(seguinte.provedor).toBe("google");
  });

  it("a carga que grava 10000 devolve osm e a seguinte não incrementa", () => {
    const noTeto = aplicarReserva(
      {periodo: "2026-10", cargas: LIMITE_MAPAS_GOOGLE - 1},
      "2026-10",
    );
    expect(noTeto.estado.cargas).toBe(LIMITE_MAPAS_GOOGLE);
    expect(noTeto.provedor).toBe("osm");
    expect(noTeto.marco).toBe("limite");
    expect(noTeto.gravar).toBe(true);

    const recusa = aplicarReserva(noTeto.estado, "2026-10");
    expect(recusa.estado.cargas).toBe(LIMITE_MAPAS_GOOGLE);
    expect(recusa.provedor).toBe("osm");
    expect(recusa.marco).toBeNull();
    expect(recusa.gravar).toBe(false);
  });

  it("duas reservas seguidas no limite não passam de 10000", () => {
    const primeira = aplicarReserva(
      {periodo: "2026-10", cargas: LIMITE_MAPAS_GOOGLE - 1},
      "2026-10",
    );
    const segunda = aplicarReserva(primeira.estado, "2026-10");
    expect(segunda.estado.cargas).toBe(LIMITE_MAPAS_GOOGLE);
  });
});

describe("mensagemMarco", () => {
  it("usa o texto administrativo da faixa e do limite", () => {
    expect(mensagemMarco("faixa", "2026-10")).toBe(
      "Mapas Google: 8000 de 10000 cargas no período 2026-10.",
    );
    expect(mensagemMarco("limite", "2026-10")).toBe(
      "Mapas Google: limite de 10000 no período 2026-10." +
        " Próximas cargas usam o mapa livre.",
    );
  });
});
