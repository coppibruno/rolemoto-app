import { describe, expect, it } from "vitest";
import { idConversa, juntarRecentes, nomeNaConversa, quandoMensagem } from "./conversa";
import type { Mensagem } from "@/types/conversa";

describe("idConversa", () => {
  it("é o mesmo nos dois sentidos", () => {
    expect(idConversa("b", "a")).toBe("a_b");
    expect(idConversa("a", "b")).toBe("a_b");
  });
});

describe("nomeNaConversa", () => {
  it("usa apelido e cai no primeiro nome", () => {
    expect(nomeNaConversa({ uid: "1", nome: "Ana Souza", apelido: "Aninha", fotoUrl: "" })).toBe(
      "Aninha",
    );
    expect(nomeNaConversa({ uid: "1", nome: "Ana Souza", apelido: " ", fotoUrl: "" })).toBe("Ana");
  });
});

describe("quandoMensagem", () => {
  const agora = new Date(2026, 10, 15, 18, 0);
  it("hoje mostra a hora", () => {
    expect(quandoMensagem(new Date(2026, 10, 15, 9, 5).toISOString(), agora)).toBe("09:05");
  });
  it("outro dia mostra a data", () => {
    expect(quandoMensagem(new Date(2026, 10, 3, 9, 5).toISOString(), agora)).toBe("03/11");
  });
});

const msg = (id: string, minuto: number): Mensagem => ({
  id,
  conversaId: "a_b",
  autorId: "a",
  texto: id,
  storyId: null,
  reacao: null,
  createdAt: new Date(Date.UTC(2026, 10, 15, 12, minuto)).toISOString(),
  story: null,
});

describe("juntarRecentes", () => {
  it("mantém as antigas e acrescenta as novas sem duplicar", () => {
    const atuais = [msg("m1", 1), msg("m2", 2), msg("m3", 3)];
    const recentes = [msg("m2", 2), msg("m3", 3), msg("m4", 4)];
    expect(juntarRecentes(atuais, recentes).map((m) => m.id)).toEqual(["m1", "m2", "m3", "m4"]);
  });

  it("página vazia não mexe na tela", () => {
    const atuais = [msg("m1", 1)];
    expect(juntarRecentes(atuais, [])).toBe(atuais);
  });
});
