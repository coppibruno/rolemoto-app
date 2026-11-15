import { describe, expect, it } from "vitest";
import { urlRotaMaps, urlViagemMaps } from "./maps";

const saida = { lat: -26.9, lng: -49.06, endereco: "Blumenau" };
const parada1 = { lat: -26.74, lng: -49.17, endereco: "Pomerode" };
const parada2 = { lat: -26.48, lng: -49.07, endereco: "Jaraguá" };
const destino = { lat: -26.3, lng: -48.84, endereco: "Joinville" };

describe("urlViagemMaps", () => {
  it("leva as paradas como waypoints na ordem, de carro", () => {
    const url = new URL(urlViagemMaps([saida, parada1, parada2, destino]));
    expect(url.searchParams.get("origin")).toBe("-26.9,-49.06");
    expect(url.searchParams.get("destination")).toBe("-26.3,-48.84");
    expect(url.searchParams.get("waypoints")).toBe("-26.74,-49.17|-26.48,-49.07");
    expect(url.searchParams.get("travelmode")).toBe("driving");
  });

  it("sem parada continua a URL de origem e destino", () => {
    expect(urlViagemMaps([saida, destino])).toBe(urlRotaMaps(saida, destino));
  });
});
