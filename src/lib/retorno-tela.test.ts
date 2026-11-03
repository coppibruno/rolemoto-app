import { describe, expect, it } from "vitest";
import { lerEstado, lerLista, lerRolagem, salvarEstado, salvarLista, salvarRolagem } from "./retorno-tela";

describe("retorno de tela", () => {
  it("guarda e lê a rolagem da rota", () => {
    salvarRolagem("/volta-teste", 640);
    expect(lerRolagem("/volta-teste")).toBe(640);
    expect(lerRolagem("/sem-visita")).toBeNull();
  });

  it("guarda e lê o estado da sessão", () => {
    salvarEstado("feed-teste", { aba: "eventos", busca: "serra" });
    expect(lerEstado<{ aba: string; busca: string }>("feed-teste")).toEqual({
      aba: "eventos",
      busca: "serra",
    });
    expect(lerEstado("inexistente")).toBeNull();
  });

  it("guarda a lista só em memória", () => {
    salvarLista("eventos-teste", [{ id: "1" }]);
    expect(lerLista<{ id: string }[]>("eventos-teste")).toEqual([{ id: "1" }]);
    expect(lerLista("vazia")).toBeNull();
  });
});