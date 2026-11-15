import type { Localizacao } from "@/types/role";

/** Espelho de `functions/src/lib/mapa-viagem.ts` (SPEC 060). O hash precisa bater com o da API. */

export type Coord = { lat: number; lng: number };

export type Retangulo = {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
};

export type TileXyz = { z: number; x: number; y: number };

export const MAX_PARADAS = 8;
export const MARGEM_CORREDOR_KM = 20;
export const ZOOM_PACOTE_MIN = 9;
export const ZOOM_PACOTE_MAX = 14;
export const AVISO_BYTES = 40 * 1024 * 1024;
export const TETO_BYTES = 120 * 1024 * 1024;
export const BYTES_POR_TILE = 8 * 1024;

const KM_POR_GRAU_LAT = 111;
const LAT_MERCATOR_MAX = 85.0511;
const RAIO_TERRA_KM = 6371;

export const cadeiaViagem = <T extends Coord>(saida: T, paradas: T[], destino: T): T[] => [
  saida,
  ...paradas,
  destino,
];

export const pontosDoRole = (role: {
  localSaida: Localizacao;
  paradas?: Localizacao[];
  destinoFinal: Localizacao;
}): Localizacao[] => cadeiaViagem(role.localSaida, role.paradas ?? [], role.destinoFinal);

export const distanciaKm = (a: Coord, b: Coord): number => {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(h));
};

export const hashPontosViagem = (pontos: Coord[]): string => {
  const texto = pontos.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const grausLng = (km: number, lat: number): number =>
  km / (KM_POR_GRAU_LAT * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));

export const corredorDaViagem = (
  pontos: Coord[],
  margemKm: number = MARGEM_CORREDOR_KM,
): Retangulo[] => {
  const dLat = margemKm / KM_POR_GRAU_LAT;
  const pernas: Retangulo[] = [];
  for (let i = 1; i < pontos.length; i++) {
    const a = pontos[i - 1];
    const b = pontos[i];
    const dLng = Math.max(grausLng(margemKm, a.lat), grausLng(margemKm, b.lat));
    pernas.push({
      latMin: Math.min(a.lat, b.lat) - dLat,
      latMax: Math.max(a.lat, b.lat) + dLat,
      lngMin: Math.min(a.lng, b.lng) - dLng,
      lngMax: Math.max(a.lng, b.lng) + dLng,
    });
  }
  return pernas;
};

/** Retângulo único que cobre todas as pernas (consulta de postos e cidades). */
export const envelope = (retangulos: Retangulo[]): Retangulo => ({
  latMin: Math.min(...retangulos.map((r) => r.latMin)),
  latMax: Math.max(...retangulos.map((r) => r.latMax)),
  lngMin: Math.min(...retangulos.map((r) => r.lngMin)),
  lngMax: Math.max(...retangulos.map((r) => r.lngMax)),
});

const tileX = (lng: number, z: number): number => {
  const n = 2 ** z;
  return Math.min(n - 1, Math.max(0, Math.floor(((lng + 180) / 360) * n)));
};

const tileY = (lat: number, z: number): number => {
  const n = 2 ** z;
  const limitada = Math.max(-LAT_MERCATOR_MAX, Math.min(LAT_MERCATOR_MAX, lat));
  const rad = (limitada * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return Math.min(n - 1, Math.max(0, Math.floor(y)));
};

export const tilesDoCorredor = (
  retangulos: Retangulo[],
  zMin: number = ZOOM_PACOTE_MIN,
  zMax: number = ZOOM_PACOTE_MAX,
): TileXyz[] => {
  const vistos = new Set<string>();
  const tiles: TileXyz[] = [];
  for (let z = zMin; z <= zMax; z++) {
    for (const r of retangulos) {
      const x0 = tileX(r.lngMin, z);
      const x1 = tileX(r.lngMax, z);
      const y0 = tileY(r.latMax, z);
      const y1 = tileY(r.latMin, z);
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          const chave = `${z}/${x}/${y}`;
          if (vistos.has(chave)) continue;
          vistos.add(chave);
          tiles.push({ z, x, y });
        }
      }
    }
  }
  return tiles;
};

export const estimarBytesPacote = (pontos: Coord[]): number =>
  tilesDoCorredor(corredorDaViagem(pontos)).length * BYTES_POR_TILE;

export const formatarMegabytes = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1).replace(".", ",") : Math.round(mb)} MB`;
};

export const formatarDistanciaKm = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km)} km`;

export const rotuloParadas = (total: number): string =>
  total === 1 ? "1 parada" : `${total} paradas`;
