import { describe, expect, it } from "vitest";
import { PMTiles, zxyToTileId, type Source } from "pmtiles";
import { concatenar, montarInicioArquivo, type EntradaTile } from "./pmtiles-escrita";

const fonteMemoria = (bytes: Uint8Array): Source => ({
  getKey: () => "memoria",
  getBytes: async (offset, length) => ({
    data: bytes.slice(offset, offset + length).buffer,
  }),
});

const montar = (tiles: { z: number; x: number; y: number; conteudo: string }[]) => {
  const entradas: EntradaTile[] = [];
  const partes: Uint8Array[] = [];
  let offset = 0;
  for (const t of tiles) {
    const bytes = new TextEncoder().encode(t.conteudo);
    entradas.push({ tileId: zxyToTileId(t.z, t.x, t.y), offset, length: bytes.length });
    partes.push(bytes);
    offset += bytes.length;
  }
  const inicio = montarInicioArquivo({
    entradas,
    tileCompression: 1,
    tileType: 1,
    minZoom: 9,
    maxZoom: 14,
    limites: { minLon: -50, minLat: -28, maxLon: -48, maxLat: -26 },
    metadados: { attribution: "© OpenStreetMap" },
  });
  return new PMTiles(fonteMemoria(concatenar([inicio, ...partes])));
};

const texto = (buf: ArrayBuffer | undefined) => (buf ? new TextDecoder().decode(buf) : null);

describe("gravador PMTiles", () => {
  it("o leitor oficial acha cada tile gravado e não inventa os ausentes", async () => {
    const arquivo = montar([
      { z: 9, x: 188, y: 290, conteudo: "a" },
      { z: 14, x: 6040, y: 9300, conteudo: "bbb" },
      { z: 12, x: 1510, y: 2325, conteudo: "cc" },
    ]);
    expect(texto((await arquivo.getZxy(9, 188, 290))?.data)).toBe("a");
    expect(texto((await arquivo.getZxy(12, 1510, 2325))?.data)).toBe("cc");
    expect(texto((await arquivo.getZxy(14, 6040, 9300))?.data)).toBe("bbb");
    expect(await arquivo.getZxy(14, 6041, 9300)).toBeUndefined();
    const header = await arquivo.getHeader();
    expect(header.minZoom).toBe(9);
    expect(header.maxZoom).toBe(14);
    expect(await arquivo.getMetadata()).toEqual({ attribution: "© OpenStreetMap" });
  });

  it("usa diretórios folha quando a raiz não cabe nos primeiros 16 KB", async () => {
    const tiles = Array.from({ length: 12000 }, (_, i) => ({
      z: 14,
      x: 6000 + (i % 120),
      y: 9000 + Math.floor(i / 120),
      conteudo: `t${i}`,
    }));
    const arquivo = montar(tiles);
    const header = await arquivo.getHeader();
    expect(header.leafDirectoryLength).toBeGreaterThan(0);
    expect(header.rootDirectoryOffset + header.rootDirectoryLength).toBeLessThanOrEqual(16384);
    expect(texto((await arquivo.getZxy(14, 6000, 9000))?.data)).toBe("t0");
    expect(texto((await arquivo.getZxy(14, 6119, 9099))?.data)).toBe("t11999");
    expect(texto((await arquivo.getZxy(14, 6050, 9040))?.data)).toBe(`t${40 * 120 + 50}`);
  });
});
