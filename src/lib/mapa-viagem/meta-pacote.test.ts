import { describe, expect, it } from "vitest";
import { lerMetaJson } from "./meta-pacote";

const valida = {
  roleId: "r1",
  titulo: "Serra",
  dataHoraSaida: "2026-11-20T10:00:00.000Z",
  pontos: [],
  pontosHash: "abc",
  baixadoEm: "2026-11-15T10:00:00.000Z",
  bytes: 10,
  postos: [{ nome: "Posto", lat: -26, lng: -49 }],
  cidades: [],
  atribuicao: "© OpenStreetMap",
};

describe("lerMetaJson", () => {
  it("devolve a meta no formato do pacote", () => {
    expect(lerMetaJson(JSON.stringify(valida))?.pontosHash).toBe("abc");
  });

  it("arquivo ilegível vira null", () => {
    expect(lerMetaJson("{quebrado")).toBeNull();
    expect(lerMetaJson("null")).toBeNull();
  });

  it("formato incompleto vira null", () => {
    expect(lerMetaJson(JSON.stringify({ ...valida, postos: undefined }))).toBeNull();
    expect(lerMetaJson(JSON.stringify({ ...valida, cidades: [{ nome: "X", lat: "a", lng: 1 }] }))).toBeNull();
    expect(lerMetaJson(JSON.stringify({ ...valida, pontosHash: 1 }))).toBeNull();
  });
});
