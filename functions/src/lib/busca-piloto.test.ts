import {describe, expect, it} from "vitest";
import {
  camposBusca,
  camposBuscaIguais,
  normalizarBusca,
  ordenarBusca,
  termoBusca,
} from "./busca-piloto";
import type {CamposBusca} from "../types/seguir";

const pessoa = (
  nome: string,
  apelido = "",
): CamposBusca & {rotulo: string} => ({
  ...camposBusca(nome, apelido),
  rotulo: apelido || nome,
});

describe("normalizarBusca e camposBusca", () => {
  it("transforma João Silva em joao silva, primeiro joao e último silva", () => {
    const campos = camposBusca("João Silva", "");
    expect(campos.nomeBusca).toBe("joao silva");
    expect(campos.primeiroNomeBusca).toBe("joao");
    expect(campos.ultimoNomeBusca).toBe("silva");
    expect(normalizarBusca("  João   Silva  ")).toBe("joao silva");
  });

  it("tira o acento de José e do apelido MotoCão", () => {
    const campos = camposBusca("José", "MotoCão");
    expect(campos.nomeBusca).toBe("jose");
    expect(campos.primeiroNomeBusca).toBe("jose");
    expect(campos.ultimoNomeBusca).toBe("jose");
    expect(campos.apelidoBusca).toBe("motocao");
  });

  it("deixa apelido vazio quando a pessoa não definiu", () => {
    expect(camposBusca("Ana", "   ").apelidoBusca).toBe("");
  });

  it("trata campo ausente como diferente de string vazia", () => {
    const campos = camposBusca("Ana", "");
    expect(camposBuscaIguais({
      nomeBusca: "ana",
      apelidoBusca: null,
      primeiroNomeBusca: "ana",
      ultimoNomeBusca: "ana",
    }, campos)).toBe(false);
    expect(camposBuscaIguais({
      nomeBusca: "ana",
      apelidoBusca: "",
      primeiroNomeBusca: "ana",
      ultimoNomeBusca: "ana",
    }, campos)).toBe(true);
  });
});

describe("ordenarBusca", () => {
  it("coloca apelido com jo antes do primeiro nome e este antes do sobrenome", () => {
    const apelido = pessoa("Carlos Lima", "Joca");
    const primeiro = pessoa("Joana Dias");
    const sobrenome = pessoa("Ana Josefa");
    const ordem = ordenarBusca("jo", [sobrenome, primeiro, apelido]);
    expect(ordem.map((item) => item.rotulo)).toEqual([
      "Joca",
      "Joana Dias",
      "Ana Josefa",
    ]);
  });

  it("desempata pelo nomeBusca", () => {
    const ordem = ordenarBusca("jo", [
      pessoa("João Silva"),
      pessoa("Joana Dias"),
    ]);
    expect(ordem.map((item) => item.nomeBusca)).toEqual([
      "joana dias",
      "joao silva",
    ]);
  });
});

describe("termoBusca", () => {
  it("recusa termo com uma letra depois de normalizar", () => {
    expect(termoBusca("j")).toBeNull();
    expect(termoBusca("  Á ")).toBeNull();
    expect(termoBusca("jo")).toBe("jo");
    expect(termoBusca(" João ")).toBe("joao");
  });
});
