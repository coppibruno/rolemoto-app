import { describe, expect, it } from "vitest";
import type { PessoaStory } from "@/types/story-local";
import { filaPessoasStory, nomeBolhaStory, pessoaVizinha, rotuloBolhaStory } from "./pessoas-story";

const pessoa = (uid: string, contagem: number, propria = false): PessoaStory => ({
  uid,
  apelido: uid,
  fotoUrl: "",
  contagem,
  naoVisto: true,
  propria,
});

describe("bolha de story", () => {
  it("chama a própria de Seu story", () => {
    const pessoa = { propria: true, apelido: "Nega", naoVisto: false };
    expect(nomeBolhaStory(pessoa)).toBe("Seu story");
    expect(rotuloBolhaStory(pessoa)).toBe("Seu story");
  });

  it("diferencia ver e rever pelo anel", () => {
    const nova = { propria: false, apelido: "Boca", naoVisto: true };
    const vista = { propria: false, apelido: "Boca", naoVisto: false };
    expect(nomeBolhaStory(nova)).toBe("Boca");
    expect(rotuloBolhaStory(nova)).toBe("Stories de Boca");
    expect(rotuloBolhaStory(vista)).toBe("Rever stories de Boca");
  });
});

describe("fila de pessoas", () => {
  const eu = pessoa("eu", 2, true);
  const boca = pessoa("boca", 1);
  const nega = pessoa("nega", 3);

  it("pula quem não tem foto e anda para os lados", () => {
    const fila = filaPessoasStory(pessoa("eu", 0, true), [boca, nega]);
    expect(fila.map((item) => item.uid)).toEqual(["boca", "nega"]);
    expect(pessoaVizinha(fila, "boca", "proxima")?.uid).toBe("nega");
    expect(pessoaVizinha(fila, "nega", "anterior")?.uid).toBe("boca");
    expect(pessoaVizinha(fila, "nega", "proxima")).toBeNull();
    expect(pessoaVizinha(fila, "boca", "anterior")).toBeNull();
  });

  it("coloca o próprio story na frente quando há foto", () => {
    const fila = filaPessoasStory(eu, [boca]);
    expect(fila.map((item) => item.uid)).toEqual(["eu", "boca"]);
    expect(pessoaVizinha(fila, "eu", "proxima")?.uid).toBe("boca");
    expect(pessoaVizinha(fila, "boca", "anterior")?.uid).toBe("eu");
  });
});
