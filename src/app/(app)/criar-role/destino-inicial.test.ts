import { describe, expect, it } from "vitest";
import { hrefCriarRoleComDestino, lerDestinoInicial } from "./destino-inicial";

describe("destino inicial do rolê", () => {
  const ponto = {
    nome: "Mirante da Graça",
    endereco: "Estrada da Graciosa, Morretes",
    lat: -25.4284,
    lng: -48.9122,
  };

  it("monta o link e recupera o destino", () => {
    const href = hrefCriarRoleComDestino(ponto);
    const query = href.split("?")[1] ?? "";
    const params = Object.fromEntries(new URLSearchParams(query));
    expect(lerDestinoInicial(params)).toEqual(ponto);
  });

  it("ignora coordenada inválida", () => {
    expect(
      lerDestinoInicial({
        destinoNome: ponto.nome,
        destinoEndereco: ponto.endereco,
        destinoLat: "abc",
        destinoLng: String(ponto.lng),
      }),
    ).toBeUndefined();
  });
});