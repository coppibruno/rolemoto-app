import {describe, expect, it, vi} from "vitest";

const docs = vi.hoisted(() => new Map<string, Record<string, unknown>>());

vi.mock("../../lib/firebase-admin", () => ({
  firestore: {
    collection: () => ({
      doc: (id: string) => ({
        get: async () => ({
          id,
          exists: docs.has(id),
          data: () => docs.get(id),
        }),
      }),
    }),
  },
}));

const {FirestoreRoleRepository} = await import("./firestore-role.repository");

const ponto = {lat: -26.9, lng: -49.06, endereco: "Blumenau, SC", nome: "Posto"};

describe("FirestoreRoleRepository — paradas", () => {
  it("documento antigo sem o campo lê []", async () => {
    docs.set("antigo", {titulo: "Velho", localSaida: ponto, destinoFinal: ponto});
    const role = await new FirestoreRoleRepository().buscarPorId("antigo");
    expect(role?.paradas).toEqual([]);
  });

  it("lê as paradas gravadas na ordem e completa o nome vazio", async () => {
    docs.set("novo", {
      titulo: "Novo",
      localSaida: ponto,
      destinoFinal: ponto,
      paradas: [{lat: -26.7, lng: -49.1, endereco: "Pomerode"}, ponto],
    });
    const role = await new FirestoreRoleRepository().buscarPorId("novo");
    expect(role?.paradas).toEqual([
      {lat: -26.7, lng: -49.1, endereco: "Pomerode", nome: ""},
      ponto,
    ]);
  });
});
