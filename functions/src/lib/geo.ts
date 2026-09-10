const RAIO_TERRA_KM = 6371;

type Coord = {lat: number; lng: number};

const toRad = (graus: number): number => (graus * Math.PI) / 180;

/** Distância em km entre dois pontos (fórmula de Haversine). */
export const haversineKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(a));
};

/** Distância inteira da rota (partida → destino). */
export const distanciaRotaKm = (origem: Coord, destino: Coord): number =>
  Math.round(haversineKm(origem.lat, origem.lng, destino.lat, destino.lng));
