import { describe, expect, it } from "vitest";
import * as api from "../../../functions/src/lib/mapa-viagem";
import {
  corredorDaViagem,
  formatarMegabytes,
  hashPontosViagem,
  rotuloParadas,
  tilesDoCorredor,
} from "./viagem";

const pontos = [
  { lat: -26.9189, lng: -49.0661 },
  { lat: -26.7406, lng: -49.1761 },
  { lat: -26.3045, lng: -48.8487 },
];

describe("espelho da lib da API", () => {
  it("hash, corredor e tiles batem com a function", () => {
    expect(hashPontosViagem(pontos)).toBe(api.hashPontosViagem(pontos));
    expect(corredorDaViagem(pontos)).toEqual(api.corredorDaViagem(pontos));
    expect(tilesDoCorredor(corredorDaViagem(pontos))).toEqual(
      api.tilesDoCorredor(api.corredorDaViagem(pontos)),
    );
  });
});

describe("rótulos", () => {
  it("singular e plural das paradas", () => {
    expect(rotuloParadas(1)).toBe("1 parada");
    expect(rotuloParadas(3)).toBe("3 paradas");
  });

  it("megabytes com vírgula abaixo de 10", () => {
    expect(formatarMegabytes(5.5 * 1024 * 1024)).toBe("5,5 MB");
    expect(formatarMegabytes(42.4 * 1024 * 1024)).toBe("42 MB");
  });
});
