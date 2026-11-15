import { describe, expect, it } from "vitest";
import type { LinhaPiloto } from "@/types/seguir";
import { filtrarSeguidos } from "./filtro-seguidos";

const pessoa = (uid: string, nome: string, apelido = ""): LinhaPiloto => ({
  uid,
  nome,
  apelido,
  fotoUrl: "",
  cidade: "",
  seguidoPorMim: true,
  segueVoce: false,
});

const lista = [pessoa("a", "Ana Souza"), pessoa("b", "Bruno Lima", "Ícaro"), pessoa("c", "Carla")];

describe("filtrarSeguidos", () => {
  it("vazio devolve a lista inteira na mesma ordem", () => {
    expect(filtrarSeguidos(lista, "  ").map((p) => p.uid)).toEqual(["a", "b", "c"]);
  });

  it("casa prefixo de qualquer palavra do nome ou apelido, sem acento", () => {
    expect(filtrarSeguidos(lista, "s").map((p) => p.uid)).toEqual(["a"]);
    expect(filtrarSeguidos(lista, "i").map((p) => p.uid)).toEqual(["b"]);
    expect(filtrarSeguidos(lista, "C").map((p) => p.uid)).toEqual(["c"]);
  });

  it("sem casamento devolve vazio", () => {
    expect(filtrarSeguidos(lista, "z")).toEqual([]);
  });
});
