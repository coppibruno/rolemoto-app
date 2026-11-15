import { describe, expect, it } from "vitest";
import { base64ParaBytes, bytesParaBase64 } from "./base64";
import {
  MAX_POSTOS,
  consultaOverpass,
  distanciaAoTracoKm,
  separarPostosECidades,
} from "./overpass";

const traco = [
  { lat: -27.0, lng: -49.0 },
  { lat: -26.0, lng: -49.0 },
];

describe("postos e cidades do pacote", () => {
  it("nomeia posto sem nome como Posto e ordena pela distância ao traço", () => {
    const { postos } = separarPostosECidades(
      [
        { type: "node", lat: -26.5, lon: -48.9, tags: { amenity: "fuel", name: "Longe" } },
        { type: "way", center: { lat: -26.5, lon: -49.001 }, tags: { amenity: "fuel" } },
      ],
      traco,
    );
    expect(postos.map((p) => p.nome)).toEqual(["Posto", "Longe"]);
    expect(postos[0]).toEqual({ nome: "Posto", lat: -26.5, lng: -49.001 });
  });

  it("cidade vem antes de vila e corta nos tetos", () => {
    const elementos = [
      { type: "node", lat: -26.4, lon: -49, tags: { place: "village", name: "Vila" } },
      { type: "node", lat: -26.9, lon: -49.3, tags: { place: "city", name: "Cidade" } },
      { type: "node", lat: -26.2, lon: -49, tags: { place: "hamlet", name: "Fora" } },
      ...Array.from({ length: 90 }, (_, i) => ({
        type: "node",
        lat: -26 - i * 0.01,
        lon: -49.01,
        tags: { amenity: "fuel" },
      })),
    ];
    const { postos, cidades } = separarPostosECidades(elementos, traco);
    expect(cidades.map((c) => c.nome)).toEqual(["Cidade", "Vila"]);
    expect(postos).toHaveLength(MAX_POSTOS);
  });

  it("distância ao traço usa o segmento, não só as pontas", () => {
    expect(distanciaAoTracoKm({ lat: -26.5, lng: -49.0 }, traco)).toBeLessThan(0.01);
  });

  it("a consulta cobre cada perna", () => {
    const q = consultaOverpass([
      { latMin: -27, latMax: -26, lngMin: -49.5, lngMax: -48.5 },
      { latMin: -26, latMax: -25, lngMin: -49.5, lngMax: -48.5 },
    ]);
    expect(q.match(/amenity/g)).toHaveLength(2);
    expect(q).toContain("[timeout:20]");
  });
});

describe("base64", () => {
  it("ida e volta com bytes altos", () => {
    const bytes = Uint8Array.from({ length: 70000 }, (_, i) => i % 256);
    expect(base64ParaBytes(bytesParaBase64(bytes))).toEqual(bytes);
  });
});
