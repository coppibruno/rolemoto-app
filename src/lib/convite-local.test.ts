import { describe, expect, it } from "vitest";
import { textoConviteLocal, urlConviteLocal } from "./convite-local";

describe("convite de local", () => {
  const dados = {
    id: "abc123",
    nome: "Posto da Serra",
    endereco: "BR-470, km 12",
    categoria: "posto" as const,
    aberto24h: true,
    horarios: [],
  };

  it("usa o www para o app abrir o link", () => {
    expect(urlConviteLocal("abc123")).toBe("https://www.rolemoto.com.br/l/abc123");
  });

  it("monta o texto no mesmo formato do convite", () => {
    expect(textoConviteLocal(dados)).toBe(
      [
        "📍 Posto da Serra",
        "🏷️ Pit Stop Oficial",
        "🕐 Aberto 24 horas",
        "📫 BR-470, km 12",
        "",
        "Abre o convite:",
        "https://www.rolemoto.com.br/l/abc123",
      ].join("\n"),
    );
  });
});
