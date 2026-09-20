import { describe, expect, it } from "vitest";
import {
  latLngParaPixelGlobal,
  urlTileOsm,
  zoomParaEnquadrar,
} from "./mapa-tiles";

describe("mapa-tiles", () => {
  it("converte São Paulo em pixel finito", () => {
    const p = latLngParaPixelGlobal(-23.5505, -46.6333, 15);
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.y)).toBe(true);
    expect(p.x).toBeGreaterThan(0);
    expect(p.y).toBeGreaterThan(0);
  });

  it("reduz zoom quando pontos estão longe", () => {
    const perto = zoomParaEnquadrar(
      [
        { lat: -23.55, lng: -46.63 },
        { lat: -23.56, lng: -46.64 },
      ],
      560,
      200,
    );
    const longe = zoomParaEnquadrar(
      [
        { lat: -23.55, lng: -46.63 },
        { lat: -22.9, lng: -43.2 },
      ],
      560,
      200,
    );
    expect(longe).toBeLessThan(perto);
  });

  it("normaliza tile X no antimeridiano", () => {
    expect(urlTileOsm(3, -1, 2)).toBe("https://tile.openstreetmap.org/3/7/2.png");
    expect(urlTileOsm(3, 8, 2)).toBe("https://tile.openstreetmap.org/3/0/2.png");
  });
});
