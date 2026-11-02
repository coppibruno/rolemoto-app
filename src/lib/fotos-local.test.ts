import { describe, expect, it } from "vitest";
import { ERRO_LIMITE_FOTOS, fotosDoLocal, selecionarFotosLocal } from "./fotos-local";

const arquivo = (nome: string, type = "image/jpeg", bytes = 8) =>
  new File([new Uint8Array(bytes)], nome, { type });

describe("fotosDoLocal", () => {
  it("usa a capa quando o documento antigo não tem a lista", () => {
    expect(fotosDoLocal({ fotoFachadaUrl: "https://cdn/a.jpg" })).toEqual([
      "https://cdn/a.jpg",
    ]);
  });

  it("prefere a galeria e descarta duplicata", () => {
    expect(
      fotosDoLocal({
        fotoFachadaUrl: "https://cdn/capa.jpg",
        fotosUrls: [" https://cdn/1.jpg ", "https://cdn/1.jpg", "https://cdn/2.jpg"],
      }),
    ).toEqual(["https://cdn/1.jpg", "https://cdn/2.jpg"]);
  });

  it("fica vazio sem nenhuma foto", () => {
    expect(fotosDoLocal({ fotoFachadaUrl: "  ", fotosUrls: [] })).toEqual([]);
  });
});

describe("selecionarFotosLocal", () => {
  it("aceita jpg e png até completar 5", () => {
    const lote = [
      arquivo("a.jpg"),
      arquivo("b.png", "image/png"),
      arquivo("c.gif", "image/gif"),
      arquivo("d.jpg"),
    ];
    const { aceitas, erro } = selecionarFotosLocal(lote, 3);
    expect(aceitas.map((file) => file.name)).toEqual(["a.jpg", "b.png"]);
    expect(erro).toBe(ERRO_LIMITE_FOTOS);
  });

  it("recusa quando já há 5 fotos", () => {
    const { aceitas, erro } = selecionarFotosLocal([arquivo("a.jpg")], 5);
    expect(aceitas).toEqual([]);
    expect(erro).toBe(ERRO_LIMITE_FOTOS);
  });
});
