import {describe, expect, it} from "vitest";
import {
  ERRO_TEXTO_LONGO,
  ERRO_TEXTO_VAZIO,
  idConversa,
  outroDaConversa,
  reacaoDe,
  resumoReacao,
  storyValidaParaResposta,
  textoMensagem,
  trechoMensagem,
} from "./conversa";

describe("idConversa e outroDaConversa", () => {
  it("monta o mesmo id nas duas ordens", () => {
    expect(idConversa("bbb", "aaa")).toBe("aaa_bbb");
    expect(idConversa("aaa", "bbb")).toBe("aaa_bbb");
  });

  it("acha o outro participante dos dois lados", () => {
    expect(outroDaConversa("aaa_bbb", "aaa")).toBe("bbb");
    expect(outroDaConversa("aaa_bbb", "bbb")).toBe("aaa");
  });

  it("terceiro não lê: id alheio volta null", () => {
    expect(outroDaConversa("aaa_bbb", "ccc")).toBeNull();
  });

  it("recusa id fora de ordem, comigo mesmo ou com barra", () => {
    expect(outroDaConversa("bbb_aaa", "aaa")).toBeNull();
    expect(outroDaConversa("aaa_aaa", "aaa")).toBeNull();
    expect(outroDaConversa("aaa_b/b", "aaa")).toBeNull();
  });
});

describe("textoMensagem", () => {
  it("aceita 1..1000 com trim", () => {
    expect(textoMensagem("  oi  ")).toEqual({ok: true, valor: "oi"});
    expect(textoMensagem("a".repeat(1000)).ok).toBe(true);
  });

  it("recusa vazio e acima de 1000", () => {
    expect(textoMensagem("   ")).toEqual({ok: false, erro: ERRO_TEXTO_VAZIO});
    expect(textoMensagem(undefined)).toEqual({ok: false, erro: ERRO_TEXTO_VAZIO});
    expect(textoMensagem("a".repeat(1001))).toEqual({ok: false, erro: ERRO_TEXTO_LONGO});
  });
});

describe("trechoMensagem", () => {
  it("junta as linhas e corta em 80", () => {
    expect(trechoMensagem("bora\n\namanhã")).toBe("bora amanhã");
    const longo = trechoMensagem("x".repeat(200));
    expect(longo).toHaveLength(80);
    expect(longo.endsWith("…")).toBe(true);
  });
});

describe("storyValidaParaResposta", () => {
  const agora = Date.parse("2026-11-15T12:00:00Z");
  const viva = {usuarioId: "dono", expiresAt: "2026-11-15T20:00:00Z"};

  it("story viva do destinatário vale", () => {
    expect(storyValidaParaResposta(viva, "dono", agora)).toBe(true);
  });

  it("story vencida, de outra pessoa ou ausente não vale", () => {
    expect(storyValidaParaResposta(
      {...viva, expiresAt: "2026-11-15T11:00:00Z"}, "dono", agora,
    )).toBe(false);
    expect(storyValidaParaResposta(viva, "outro", agora)).toBe(false);
    expect(storyValidaParaResposta(null, "dono", agora)).toBe(false);
  });
});

describe("reacaoDe", () => {
  it("aceita só as seis reações", () => {
    expect(reacaoDe("riso")).toBe("riso");
    expect(reacaoDe("fogo")).toBe("fogo");
    expect(reacaoDe("toString")).toBeNull();
    expect(reacaoDe("coracao")).toBeNull();
    expect(reacaoDe(1)).toBeNull();
  });

  it("resumo leva o emoji", () => {
    expect(resumoReacao("apaixonado")).toBe("Reagiu ao seu story 😍");
  });
});
