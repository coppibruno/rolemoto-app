import {describe, expect, it} from "vitest";
import {
  deveNotificarAlbum,
  fraseAlbum,
  podePublicarAlbum,
  TETO_ALBUNS_EVENTO,
  validarUrlAlbum,
} from "./album-evento";

describe("AF1 — álbum do fotógrafo", () => {
  it("aceita https absoluto e rejeita o resto", () => {
    expect(validarUrlAlbum("  https://photos.google.com/share/x  ")).toEqual({
      ok: true,
      url: "https://photos.google.com/share/x",
    });
    expect(validarUrlAlbum("http://photos.google.com/x").ok).toBe(false);
    expect(validarUrlAlbum("ftp://files/x").ok).toBe(false);
    expect(validarUrlAlbum("/relativo").ok).toBe(false);
    expect(validarUrlAlbum("javascript:alert(1)").ok).toBe(false);
    expect(validarUrlAlbum("").ok).toBe(false);
    expect(validarUrlAlbum(null).ok).toBe(false);
  });

  it("notifica só na primeira publicação", () => {
    expect(deveNotificarAlbum(0, false)).toBe(true);
    expect(deveNotificarAlbum(1, false)).toBe(false);
    expect(deveNotificarAlbum(0, true)).toBe(false);
    expect(deveNotificarAlbum(2, true)).toBe(false);
  });

  it("monta a frase e a permissão", () => {
    expect(fraseAlbum("Lia", "Velharia")).toBe("Lia adicionou as fotos de Velharia");
    expect(fraseAlbum("", "")).toBe("Alguém adicionou as fotos de o evento");
    expect(podePublicarAlbum("ana", "ana", false)).toBe(true);
    expect(podePublicarAlbum("ana", "bruno", false)).toBe(false);
    expect(podePublicarAlbum("ana", null, true)).toBe(true);
    expect(podePublicarAlbum("ana", null, false)).toBe(false);
    expect(TETO_ALBUNS_EVENTO).toBe(5);
  });
});
