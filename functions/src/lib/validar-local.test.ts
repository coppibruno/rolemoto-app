import {describe, expect, it} from "vitest";
import {validarPublicacaoLocal} from "./validar-local";

const base = {
  nome: "Posto da Serra",
  endereco: "Rodovia BR-116, km 42",
  lat: -27.5,
  lng: -51.5,
  categoria: "posto",
  facilidades: [],
  aberto24h: true,
  horarios: [],
  linkMaps: "",
};

const url = (id: string) => `https://cdn.exemplo/${id}.jpg`;

describe("validarPublicacaoLocal fotos", () => {
  it("trata a capa antiga como a única foto da galeria", () => {
    const resultado = validarPublicacaoLocal({
      ...base,
      fotoFachadaUrl: url("capa"),
    });
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.dados.fotoFachadaUrl).toBe(url("capa"));
    expect(resultado.dados.fotosUrls).toEqual([url("capa")]);
  });

  it("grava até 5 fotos e usa a primeira como capa", () => {
    const fotos = [url("1"), url("2"), url("1")];
    const resultado = validarPublicacaoLocal({
      ...base,
      fotoFachadaUrl: url("ignorada"),
      fotosUrls: fotos,
    });
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.dados.fotosUrls).toEqual([url("1"), url("2")]);
    expect(resultado.dados.fotoFachadaUrl).toBe(url("1"));
  });

  it("recusa a sexta foto", () => {
    const fotosUrls = [1, 2, 3, 4, 5, 6].map((n) => url(String(n)));
    const resultado = validarPublicacaoLocal({...base, fotosUrls});
    expect(resultado).toEqual({ok: false, erro: "no máximo 5 fotos"});
  });

  it("recusa endereço que não é http", () => {
    const resultado = validarPublicacaoLocal({
      ...base,
      fotosUrls: ["javascript:alert(1)"],
    });
    expect(resultado).toEqual({ok: false, erro: "foto inválida"});
  });
});
