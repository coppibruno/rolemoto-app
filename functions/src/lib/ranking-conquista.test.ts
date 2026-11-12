import {describe, expect, it} from "vitest";
import {cortarRoda, montarRanking, type PessoaRanking} from "./ranking-conquista";
import type {UsuarioConquista} from "../types/conquista";

const pessoa = (uid: string, apelido = ""): PessoaRanking => ({
  uid,
  nome: `Nome ${uid}`,
  apelido,
  fotoUrl: `https://foto/${uid}`,
});

const carimbo = (
  usuarioId: string,
  velocidadeMaxKmh: number,
  recordeEm = "2026-11-01T10:00:00.000Z",
): UsuarioConquista => ({
  id: `${usuarioId}_pino`,
  usuarioId,
  conquistaId: "pino",
  velocidadeMaxKmh,
  telemetriaId: "t",
  primeiraVezEm: recordeEm,
  recordeEm,
  createdAt: recordeEm,
  updatedAt: recordeEm,
});

describe("cortarRoda", () => {
  it("põe o token na frente e corta 100 seguidos sem contar o próprio uid", () => {
    const seguidos = ["eu", ...Array.from({length: 120}, (_, i) => `u${i}`)];
    const roda = cortarRoda("eu", seguidos);
    expect(roda[0]).toBe("eu");
    expect(roda).toHaveLength(101);
    expect(roda).toContain("u99");
    expect(roda).not.toContain("u100");
  });

  it("ignora repetidos e vazios", () => {
    expect(cortarRoda("eu", ["a", "", "a", "b"])).toEqual(["eu", "a", "b"]);
  });
});

describe("montarRanking", () => {
  it("ordena por velocidade, depois recordeEm, depois uid", () => {
    const itens = montarRanking({
      tokenUid: "eu",
      pessoas: ["eu", "a", "b", "c", "d"].map((uid) => pessoa(uid)),
      carimbos: [
        carimbo("d", 60.04, "2026-11-02T10:00:00.000Z"),
        carimbo("c", 60, "2026-11-02T10:00:00.000Z"),
        carimbo("b", 60, "2026-11-01T10:00:00.000Z"),
        carimbo("a", 80),
        carimbo("eu", 70),
      ],
    });
    expect(itens.map((i) => [i.uid, i.posicao])).toEqual([
      ["a", 1],
      ["eu", 2],
      ["b", 3],
      ["c", 4],
      ["d", 5],
    ]);
    expect(itens[1]?.eu).toBe(true);
  });

  it("apelido vazio cai no primeiro nome", () => {
    const [linha] = montarRanking({
      tokenUid: "eu",
      pessoas: [pessoa("eu", "Zé")],
      carimbos: [],
    });
    expect(linha).toEqual({
      posicao: null,
      uid: "eu",
      apelido: "Zé",
      fotoUrl: "https://foto/eu",
      velocidadeMaxKmh: null,
      eu: true,
    });
    expect(montarRanking({tokenUid: "x", pessoas: [pessoa("x")], carimbos: []})[0]?.apelido)
      .toBe("Nome");
  });

  it("seguido sem users sai; seguindo zero com carimbo dá posição 1", () => {
    const itens = montarRanking({
      tokenUid: "eu",
      pessoas: [pessoa("eu")],
      carimbos: [carimbo("sumido", 99), carimbo("eu", 50)],
    });
    expect(itens.map((i) => [i.uid, i.posicao, i.velocidadeMaxKmh])).toEqual([
      ["eu", 1, 50],
    ]);
  });
});
