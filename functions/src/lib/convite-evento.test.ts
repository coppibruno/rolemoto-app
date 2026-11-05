import {describe, expect, it} from "vitest";
import {
  classificarConvites,
  fraseConvite,
  quandoConvite,
  uidsUnicos,
} from "./convite-evento";
import type {ContextoConvite} from "./convite-evento";

const contexto = (): ContextoConvite => ({
  tokenUid: "eu",
  perfisExistentes: new Set(["eu", "ana", "bia", "caio", "dani"]),
  inscritos: new Set(["bia"]),
  jaConvidados: new Set(["caio", "bia"]),
});

describe("classificarConvites", () => {
  it("manda vazio, o próprio token, perfil ausente e uid longo para ignorados", () => {
    const longo = "x".repeat(129);
    const resultado = classificarConvites(
      ["", "eu", "sumido", longo, "ana"],
      contexto(),
    );
    expect(resultado.ignorados).toEqual(["", "eu", "sumido", longo]);
    expect(resultado.enviados).toEqual(["ana"]);
  });

  it("prioriza quem já vai, mesmo com doc de convite, e não repete uid", () => {
    const resultado = classificarConvites(
      ["bia", "caio", "dani", "ana", "ana"],
      contexto(),
    );
    expect(resultado.jaInscritos).toEqual(["bia"]);
    expect(resultado.jaConvidados).toEqual(["caio"]);
    expect(resultado.enviados).toEqual(["dani", "ana"]);
    const todos = [
      ...resultado.ignorados,
      ...resultado.jaInscritos,
      ...resultado.jaConvidados,
      ...resultado.enviados,
    ];
    expect(new Set(todos).size).toBe(todos.length);
    expect(todos).not.toContain("eu");
  });
});

describe("fraseConvite", () => {
  it("monta a frase e troca título vazio por o evento", () => {
    expect(fraseConvite("Ana", "Velharia")).toBe(
      "Ana te chamou para Velharia",
    );
    expect(fraseConvite("Ana", "")).toBe("Ana te chamou para o evento");
    expect(fraseConvite("Ana", "   ")).toBe("Ana te chamou para o evento");
  });
});

describe("quandoConvite", () => {
  it("formata a abertura em São Paulo e só acrescenta o fim em outro dia", () => {
    const abertura = "2026-11-12T22:30:00.000Z";
    expect(quandoConvite(abertura, null)).toBe("qui 12 nov · 19:30");
    expect(quandoConvite(abertura, "2026-11-13T01:00:00.000Z")).toBe(
      "qui 12 nov · 19:30",
    );
    expect(quandoConvite(abertura, "2026-11-13T03:30:00.000Z")).toBe(
      "qui 12 nov · 19:30 – sex 13 nov · 00:30",
    );
  });
});

describe("uidsUnicos", () => {
  it("conta duplicata uma vez e recusa o que não é lista de string", () => {
    expect(uidsUnicos(["a", "a", "b"])).toEqual(["a", "b"]);
    expect(uidsUnicos([])).toEqual([]);
    expect(uidsUnicos(undefined)).toBeNull();
    expect(uidsUnicos(["a", 1])).toBeNull();
  });
});
