import { describe, expect, it } from "vitest";
import { urlAbrirMaps, urlViagemMaps } from "./maps";

const saida = { lat: -26.9, lng: -49.06, endereco: "Blumenau" };
const parada1 = { lat: -26.74, lng: -49.17, endereco: "Pomerode" };
const parada2 = { lat: -26.48, lng: -49.07, endereco: "Jaraguá" };
const destino = { lat: -26.3, lng: -48.84, endereco: "Joinville" };

describe("urlViagemMaps", () => {
  it("leva saída, paradas e destino no caminho, nessa ordem, de carro", () => {
    expect(urlViagemMaps([saida, parada1, parada2, destino])).toBe(
      "https://www.google.com/maps/dir/-26.9,-49.06/-26.74,-49.17/-26.48,-49.07/-26.3,-48.84/data=!3e0",
    );
  });

  it("sem parada leva saída e destino, também de carro", () => {
    expect(urlViagemMaps([saida, destino])).toBe(
      "https://www.google.com/maps/dir/-26.9,-49.06/-26.3,-48.84/data=!3e0",
    );
  });

  it("parada sem coordenada sai do caminho, sem miolo vazio", () => {
    const semCoord = { lat: null, lng: null, endereco: "Algum lugar" };
    const url = urlViagemMaps([saida, semCoord, parada2, destino]);
    expect(url).toBe("https://www.google.com/maps/dir/-26.9,-49.06/-26.48,-49.07/-26.3,-48.84/data=!3e0");
    expect(url).not.toContain("//-");
  });

  it("saída sem coordenada abre o destino", () => {
    const semCoord = { lat: Number.NaN, lng: -49, endereco: "Blumenau" };
    expect(urlViagemMaps([semCoord, parada1, destino])).toBe(urlAbrirMaps(destino));
  });
});
