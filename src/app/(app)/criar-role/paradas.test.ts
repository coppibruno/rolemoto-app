import { describe, expect, it } from "vitest";
import type { Localizacao } from "@/types/role";
import { incluirParada, moverParada, paradaDoSeletor, removerParada } from "./paradas";

const p = (nome: string): Localizacao => ({ lat: -27, lng: -49, endereco: `${nome}, SC`, nome });

describe("lista de paradas do formulário", () => {
  it("inclui até 8 e ignora a nona", () => {
    let lista: Localizacao[] = [];
    for (let i = 1; i <= 9; i++) lista = incluirParada(lista, p(`P${i}`));
    expect(lista).toHaveLength(8);
    expect(lista[7].nome).toBe("P8");
  });

  it("sobe, desce e não passa da borda", () => {
    const lista = [p("A"), p("B"), p("C")];
    expect(moverParada(lista, 1, -1).map((x) => x.nome)).toEqual(["B", "A", "C"]);
    expect(moverParada(lista, 1, 1).map((x) => x.nome)).toEqual(["A", "C", "B"]);
    expect(moverParada(lista, 0, -1)).toBe(lista);
    expect(moverParada(lista, 2, 1)).toBe(lista);
  });

  it("remove pela posição", () => {
    expect(removerParada([p("A"), p("B"), p("C")], 1).map((x) => x.nome)).toEqual(["A", "C"]);
  });
});

describe("ponto do seletor vira parada", () => {
  const valor = { endereco: " Posto BR-470 ", lat: -26.9, lng: -49.1, nome: "" };

  it("ponto com coordenada no Sul entra direto", () => {
    expect(paradaDoSeletor(valor, false)).toEqual({
      lat: -26.9,
      lng: -49.1,
      endereco: "Posto BR-470",
      nome: "",
    });
  });

  it("sem coordenada ou com o endereço do mapa ainda resolvendo, não entra", () => {
    expect(paradaDoSeletor({ ...valor, lat: null, lng: null }, false)).toBeNull();
    expect(paradaDoSeletor(valor, true)).toBeNull();
  });

  it("fora do Sul não entra", () => {
    expect(paradaDoSeletor({ ...valor, lat: -23.55, lng: -46.63 }, false)).toBeNull();
  });
});
