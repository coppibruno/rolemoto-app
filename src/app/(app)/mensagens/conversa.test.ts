import { describe, expect, it } from "vitest";
import { idConversa, nomeNaConversa, quandoMensagem } from "./conversa";

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
