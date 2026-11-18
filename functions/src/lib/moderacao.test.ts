import {describe, expect, it} from "vitest";
import {
  dentroJanelaDedupe,
  ehAlvoDenuncia,
  ehMotivoDenuncia,
  estaNoParBloqueado,
  idBloqueio,
  normalizarDetalhes,
  omitirBloqueados,
  validarBodyDenuncia,
  ERRO_DETALHES_OUTRO,
} from "./moderacao";
import {JANELA_DEDUPE_DENUNCIA_MS} from "../types/moderacao";

describe("idBloqueio", () => {
  it("monta o id composto", () => {
    expect(idBloqueio("eu", "ela")).toBe("eu_ela");
  });
});

describe("ehMotivoDenuncia / ehAlvoDenuncia", () => {
  it("aceita o enum e recusa o resto", () => {
    expect(ehMotivoDenuncia("spam")).toBe(true);
    expect(ehMotivoDenuncia("golpe")).toBe(false);
    expect(ehAlvoDenuncia("post")).toBe(true);
    expect(ehAlvoDenuncia("role")).toBe(false);
  });
});

describe("normalizarDetalhes", () => {
  it("trim, teto e rejeita não-string", () => {
    expect(normalizarDetalhes(undefined)).toBe("");
    expect(normalizarDetalhes("  oi  ")).toBe("oi");
    expect(normalizarDetalhes("x".repeat(300)).length).toBe(280);
    expect(normalizarDetalhes(1)).toBeNull();
  });
});

describe("validarBodyDenuncia", () => {
  it("exige motivo e alvo válidos", () => {
    expect(validarBodyDenuncia({})).toEqual({erro: "alvoTipo inválido"});
    expect(
      validarBodyDenuncia({alvoTipo: "post", alvoId: "p1", motivo: "x"}),
    ).toEqual({erro: "motivo inválido"});
  });

  it("exige detalhes ≥ 3 quando motivo é outro", () => {
    expect(
      validarBodyDenuncia({
        alvoTipo: "perfil",
        alvoId: "u1",
        motivo: "outro",
        detalhes: "ab",
      }),
    ).toEqual({erro: ERRO_DETALHES_OUTRO});
    expect(
      validarBodyDenuncia({
        alvoTipo: "perfil",
        alvoId: "u1",
        motivo: "outro",
        detalhes: "abc",
      }),
    ).toEqual({
      alvoTipo: "perfil",
      alvoId: "u1",
      motivo: "outro",
      detalhes: "abc",
    });
  });

  it("aceita spam sem detalhes", () => {
    expect(
      validarBodyDenuncia({
        alvoTipo: "story",
        alvoId: "s1",
        motivo: "spam",
      }),
    ).toEqual({
      alvoTipo: "story",
      alvoId: "s1",
      motivo: "spam",
      detalhes: "",
    });
  });
});

describe("dentroJanelaDedupe", () => {
  it("respeita a janela de 24 h", () => {
    const agora = Date.parse("2026-11-18T12:00:00.000Z");
    const dentro = new Date(agora - JANELA_DEDUPE_DENUNCIA_MS + 1000).toISOString();
    const fora = new Date(agora - JANELA_DEDUPE_DENUNCIA_MS - 1000).toISOString();
    expect(dentroJanelaDedupe(dentro, agora)).toBe(true);
    expect(dentroJanelaDedupe(fora, agora)).toBe(false);
    expect(dentroJanelaDedupe("lixo", agora)).toBe(false);
  });
});

describe("estaNoParBloqueado / omitirBloqueados", () => {
  it("filtra pelo set", () => {
    const set = new Set(["a", "c"]);
    expect(estaNoParBloqueado(set, "a")).toBe(true);
    expect(estaNoParBloqueado(set, "b")).toBe(false);
    expect(
      omitirBloqueados(
        [{autorId: "a"}, {autorId: "b"}, {autorId: "c"}],
        set,
        (item) => item.autorId,
      ),
    ).toEqual([{autorId: "b"}]);
  });
});
