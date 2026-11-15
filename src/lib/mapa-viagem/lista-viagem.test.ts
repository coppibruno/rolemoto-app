import { describe, expect, it } from "vitest";
import { lugaresDoPacote, planoDaViagem } from "./lista-viagem";

const pontos = [
  { lat: -26.9, lng: -49.06, endereco: "Blumenau", nome: "Posto Shell" },
  { lat: -26.74, lng: -49.17, endereco: "Pomerode", nome: "" },
  { lat: -26.3, lng: -48.84, endereco: "Joinville", nome: "Mirante" },
];

describe("lista da viagem", () => {
  it("sem GPS mostra a ordem do plano, sem distância", () => {
    const itens = planoDaViagem(pontos, null);
    expect(itens.map((i) => [i.marca, i.titulo, i.distanciaKm])).toEqual([
      ["S", "Posto Shell", null],
      ["1", "Pomerode", null],
      ["D", "Mirante", null],
    ]);
    expect(itens[1].subtitulo).toBe("Parada 1");
  });

  it("com GPS cada ponto ganha a distância em linha reta e a ordem do plano fica", () => {
    const itens = planoDaViagem(pontos, { lat: -26.3, lng: -48.84 });
    expect(itens.map((i) => i.tipo)).toEqual(["saida", "parada", "destino"]);
    expect(itens[2].distanciaKm).toBeCloseTo(0, 5);
    expect(itens[0].distanciaKm).toBeGreaterThan(60);
  });

  it("postos e cidades vão pela distância quando há GPS", () => {
    const itens = lugaresDoPacote(
      [{ nome: "Posto longe", lat: -27.5, lng: -49 }, { nome: "Posto perto", lat: -26.31, lng: -48.84 }],
      [{ nome: "Joinville", lat: -26.3, lng: -48.85 }],
      { lat: -26.3, lng: -48.84 },
    );
    expect(itens.map((i) => i.titulo)).toEqual(["Joinville", "Posto perto", "Posto longe"]);
    expect(lugaresDoPacote([], [], null)).toEqual([]);
  });
});
