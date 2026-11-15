import { describe, expect, it } from "vitest";
import type { Localizacao } from "@/types/role";
import { incluirParada, moverParada, removerParada } from "./paradas";

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
