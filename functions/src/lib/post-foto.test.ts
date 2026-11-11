import {describe, expect, it} from "vitest";
import {
  comentarioDe,
  dentroDoTeto,
  legendaDe,
  marcaDe,
  storyJaEncaminhada,
} from "./post-foto";

describe("FP1 — legendaDe", () => {
  it("ausente, null e vazio viram string vazia", () => {
    for (const valor of [undefined, null, ""]) {
      expect(legendaDe(valor)).toEqual({ok: true, valor: ""});
    }
  });

  it("faz trim e mantém a quebra de linha do meio", () => {
    expect(legendaDe("  serra\nde manhã  ")).toEqual({ok: true, valor: "serra\nde manhã"});
  });

  it("500 passam e 501 devolvem legenda longa demais", () => {
    expect(legendaDe("a".repeat(500))).toEqual({ok: true, valor: "a".repeat(500)});
    expect(legendaDe(`  ${"a".repeat(500)}  `).ok).toBe(true);
    expect(legendaDe("a".repeat(501))).toEqual({ok: false, erro: "legenda longa demais"});
  });

  it("outro tipo é recusado", () => {
    expect(legendaDe(42)).toEqual({ok: false, erro: "legenda longa demais"});
    expect(legendaDe({texto: "x"}).ok).toBe(false);
  });
});

describe("FP1 — comentarioDe", () => {
  it("só espaços falha com escreva um comentário", () => {
    expect(comentarioDe("   \n ")).toEqual({ok: false, erro: "escreva um comentário"});
    expect(comentarioDe("")).toEqual({ok: false, erro: "escreva um comentário"});
  });

  it("280 passam e 281 devolvem comentário longo demais", () => {
    expect(comentarioDe(` ${"b".repeat(280)} `)).toEqual({ok: true, valor: "b".repeat(280)});
    expect(comentarioDe("b".repeat(281))).toEqual({ok: false, erro: "comentário longo demais"});
  });

  it("outro tipo devolve comentário longo demais", () => {
    expect(comentarioDe(undefined)).toEqual({ok: false, erro: "comentário longo demais"});
    expect(comentarioDe(7).ok).toBe(false);
  });
});

describe("FP1 — marcaDe", () => {
  it("ausente ou null é sem marca", () => {
    expect(marcaDe(undefined)).toEqual({ok: true, valor: null});
    expect(marcaDe(null)).toEqual({ok: true, valor: null});
  });

  it("local e evento com id passam", () => {
    expect(marcaDe({tipo: "local", id: "abc"})).toEqual({
      ok: true,
      valor: {tipo: "local", id: "abc"},
    });
    expect(marcaDe({tipo: "evento", id: " ev1 "})).toEqual({
      ok: true,
      valor: {tipo: "evento", id: "ev1"},
    });
  });

  it("os dois juntos, id vazio, barra, tipo estranho ou campo a mais são recusados", () => {
    const ruins: unknown[] = [
      {localId: "a", eventoId: "b"},
      {tipo: "local", id: "a", eventoId: "b"},
      {tipo: ["local", "evento"], id: "a"},
      {tipo: "local", id: ""},
      {tipo: "local", id: "   "},
      {tipo: "evento", id: "a/b"},
      {tipo: "rolê", id: "a"},
      {tipo: "local"},
      {id: "a"},
      "local",
      [],
    ];
    for (const valor of ruins) {
      expect(marcaDe(valor), JSON.stringify(valor)).toEqual({ok: false, erro: "marca inválida"});
    }
  });
});

describe("FP1 — teto e dedup", () => {
  it("dentroDoTeto(9) é verdadeiro e dentroDoTeto(10) é falso", () => {
    expect(dentroDoTeto(0)).toBe(true);
    expect(dentroDoTeto(9)).toBe(true);
    expect(dentroDoTeto(10)).toBe(false);
  });

  it("só a story no ar com aquele postId conta", () => {
    const agora = new Date("2026-11-11T12:00:00.000Z");
    const futuro = "2026-11-11T20:00:00.000Z";
    const passado = "2026-11-11T11:59:59.000Z";
    expect(storyJaEncaminhada([{postId: "p1", expiresAt: passado}], "p1", agora)).toBe(false);
    expect(storyJaEncaminhada([{postId: null, expiresAt: futuro}], "p1", agora)).toBe(false);
    expect(storyJaEncaminhada([{postId: "p2", expiresAt: futuro}], "p1", agora)).toBe(false);
    expect(storyJaEncaminhada([], "p1", agora)).toBe(false);
    expect(storyJaEncaminhada([
      {postId: "p2", expiresAt: futuro},
      {postId: "p1", expiresAt: futuro},
    ], "p1", agora)).toBe(true);
    expect(storyJaEncaminhada(
      [{postId: "p1", expiresAt: agora.toISOString()}],
      "p1",
      agora,
    )).toBe(false);
  });
});
