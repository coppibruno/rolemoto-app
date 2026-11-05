import { describe, expect, it } from "vitest";
import {
  assinarSeguir,
  assinarVersaoSeguir,
  lerVersaoSeguir,
  publicarSeguir,
} from "./seguir-contadores";

describe("contadores de seguir", () => {
  it("avisa a mudança e avança a versão", () => {
    const antes = lerVersaoSeguir();
    const mudancas: number[] = [];
    let avisos = 0;
    const sairMudanca = assinarSeguir((mudanca) => {
      mudancas.push(mudanca.delta);
    });
    const sairVersao = assinarVersaoSeguir(() => {
      avisos += 1;
    });

    publicarSeguir({ uid: "piloto-a", delta: 1 });

    expect(lerVersaoSeguir()).toBe(antes + 1);
    expect(mudancas).toEqual([1]);
    expect(avisos).toBe(1);

    sairMudanca();
    sairVersao();
    publicarSeguir({ uid: "piloto-a", delta: -1 });
    expect(mudancas).toEqual([1]);
    expect(lerVersaoSeguir()).toBe(antes + 2);
  });
});