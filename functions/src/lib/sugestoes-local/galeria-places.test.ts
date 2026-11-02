import {describe, expect, it} from "vitest";
import {escolherFotosExtras, galeriaAtual} from "./galeria-places";

const foto = (id: string) => ({recurso: `places/ChIJteste/photos/${id}`});

describe("galeriaAtual", () => {
  it("usa a capa quando o documento antigo não tem a lista", () => {
    expect(galeriaAtual("https://cdn/capa.jpg", undefined)).toEqual([
      "https://cdn/capa.jpg",
    ]);
  });
});

describe("escolherFotosExtras", () => {
  it("pula a capa conhecida e preenche até 5", () => {
    const extras = escolherFotosExtras({
      placeId: "ChIJteste",
      galeria: ["https://cdn/capa.jpg"],
      fotos: [foto("capa"), foto("b"), foto("c"), foto("d"), foto("e")],
      recursoCapa: "places/ChIJteste/photos/capa",
    });
    expect(extras.map((recurso) => recurso.split("/").pop())).toEqual([
      "b", "c", "d", "e",
    ]);
  });

  it("sem recurso salvo, assume que a primeira da Places é a capa", () => {
    const extras = escolherFotosExtras({
      placeId: "ChIJteste",
      galeria: ["https://cdn/capa.jpg"],
      fotos: [foto("a"), foto("b")],
      recursoCapa: "",
    });
    expect(extras).toEqual(["places/ChIJteste/photos/b"]);
  });

  it("local sem foto nenhuma recebe a primeira da Places", () => {
    const extras = escolherFotosExtras({
      placeId: "ChIJteste",
      galeria: [],
      fotos: [foto("a"), foto("b")],
      recursoCapa: "places/ChIJteste/photos/a",
    });
    expect(extras.map((recurso) => recurso.split("/").pop())).toEqual(["a", "b"]);
  });

  it("não baixa de novo a foto que já está na galeria", () => {
    const extras = escolherFotosExtras({
      placeId: "ChIJteste",
      galeria: [
        "https://cdn/capa.jpg",
        "https://cdn/o/locais%2Ffachadas%2Fsugestoes%2FChIJteste--b.jpg?alt=media",
      ],
      fotos: [foto("capa"), foto("b"), foto("c")],
      recursoCapa: "places/ChIJteste/photos/capa",
    });
    expect(extras).toEqual(["places/ChIJteste/photos/c"]);
  });

  it("não pede foto quando a galeria já tem 5", () => {
    const extras = escolherFotosExtras({
      placeId: "ChIJteste",
      galeria: ["1", "2", "3", "4", "5"],
      fotos: [foto("a"), foto("b")],
      recursoCapa: "",
    });
    expect(extras).toEqual([]);
  });
});
