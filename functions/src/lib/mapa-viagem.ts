import {haversineKm} from "./geo";
import {parseLocalizacao} from "./localizacao-role";
import {ERRO_LOCALIZACAO_FORA_DO_SUL, pontoEstaNoSul} from "./regiao-sul";
import type {Localizacao} from "../types/role";

/** Mapa da viagem e paradas do rolê (SPEC 060). Sem Firestore e sem rede. */

export type Coord = {lat: number; lng: number};

export type Retangulo = {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
};

export type TileXyz = {z: number; x: number; y: number};

export const MAX_PARADAS = 8;
export const MARGEM_CORREDOR_KM = 20;
export const ZOOM_PACOTE_MIN = 9;
export const ZOOM_PACOTE_MAX = 14;
export const AVISO_BYTES = 40 * 1024 * 1024;
export const TETO_BYTES = 120 * 1024 * 1024;
export const BYTES_POR_TILE = 8 * 1024;

const KM_POR_GRAU_LAT = 111;
const LAT_MERCATOR_MAX = 85.0511;

export const ERRO_PARADAS_TETO = `No máximo ${MAX_PARADAS} paradas`;

/** Ausente vale `[]`. Cada item passa pelo parser da partida e pelo recorte Sul. */
export const parseParadas = (
  bruto: unknown,
): {ok: true; paradas: Localizacao[]} | {ok: false; erro: string} => {
  if (bruto === undefined || bruto === null) return {ok: true, paradas: []};
  if (!Array.isArray(bruto)) return {ok: false, erro: "paradas inválidas"};
  if (bruto.length > MAX_PARADAS) return {ok: false, erro: ERRO_PARADAS_TETO};
  const paradas: Localizacao[] = [];
  for (const item of bruto) {
    const ponto = parseLocalizacao(item);
    if (!ponto) return {ok: false, erro: "parada inválida"};
    if (!pontoEstaNoSul(ponto.lat, ponto.lng)) {
      return {ok: false, erro: ERRO_LOCALIZACAO_FORA_DO_SUL};
    }
    paradas.push(ponto);
  }
  return {ok: true, paradas};
};

export const cadeiaViagem = (
  saida: Coord,
  paradas: Coord[],
  destino: Coord,
): Coord[] => [saida, ...paradas, destino];

/** Soma as pernas na ordem e arredonda uma vez no final. */
export const distanciaCadeiaKm = (pontos: Coord[]): number => {
  let total = 0;
  for (let i = 1; i < pontos.length; i++) {
    const a = pontos[i - 1];
    const b = pontos[i];
    total += haversineKm(a.lat, a.lng, b.lat, b.lng);
  }
  return Math.round(total);
};

export const distanciaViagemKm = (role: {
  localSaida: Coord;
  paradas?: Coord[];
  destinoFinal: Coord;
}): number =>
  distanciaCadeiaKm(
    cadeiaViagem(role.localSaida, role.paradas ?? [], role.destinoFinal),
  );

/** FNV-1a 32 bits do texto `lat,lng|lat,lng` com 5 casas. O nome não entra. */
export const hashPontosViagem = (pontos: Coord[]): string => {
  const texto = pontos
    .map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
    .join("|");
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const grausLng = (km: number, lat: number): number => {
  const cos = Math.cos((lat * Math.PI) / 180);
  return km / (KM_POR_GRAU_LAT * Math.max(cos, 0.01));
};

/** Um retângulo por perna, dilatado pela margem para cada lado. */
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

/** Tiles XYZ dos retângulos, sem repetir o que duas pernas cobrem. */
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
          tiles.push({z, x, y});
        }
      }
    }
  }
  return tiles;
};

export const estimarTiles = (retangulos: Retangulo[]): number =>
  tilesDoCorredor(retangulos).length;

/** Teto de aviso, não a fatura. */
export const estimarBytes = (retangulos: Retangulo[]): number =>
  estimarTiles(retangulos) * BYTES_POR_TILE;
