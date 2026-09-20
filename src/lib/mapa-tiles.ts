/** Tamanho padrão de um tile XYZ (Web Mercator). */
export const TAMANHO_TILE = 256;

export type PontoLatLng = {
  lat: number;
  lng: number;
};

/** Converte lat/lng em pixel global no zoom dado (esquema OSM/Web Mercator). */
export const latLngParaPixelGlobal = (
  lat: number,
  lng: number,
  zoom: number,
): { x: number; y: number } => {
  const n = 2 ** zoom;
  const latClamp = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const latRad = (latClamp * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n * TAMANHO_TILE;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    n *
    TAMANHO_TILE;
  return { x, y };
};

/** Zoom máximo que ainda enquadra todos os pontos no viewport (com padding). */
export const zoomParaEnquadrar = (
  pontos: PontoLatLng[],
  widthPx: number,
  heightPx: number,
  paddingPx = 40,
  zoomMax = 16,
  zoomMin = 3,
): number => {
  if (pontos.length === 0) return 14;
  if (pontos.length === 1) return Math.min(zoomMax, 15);

  for (let z = zoomMax; z >= zoomMin; z -= 1) {
    const pixels = pontos.map((p) => latLngParaPixelGlobal(p.lat, p.lng, z));
    const xs = pixels.map((p) => p.x);
    const ys = pixels.map((p) => p.y);
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    if (spanX + paddingPx * 2 <= widthPx && spanY + paddingPx * 2 <= heightPx) {
      return z;
    }
  }
  return zoomMin;
};

export const centroPixelDosPontos = (
  pontos: PontoLatLng[],
  zoom: number,
): { x: number; y: number } => {
  if (pontos.length === 0) return { x: 0, y: 0 };
  const pixels = pontos.map((p) => latLngParaPixelGlobal(p.lat, p.lng, zoom));
  const xs = pixels.map((p) => p.x);
  const ys = pixels.map((p) => p.y);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
};

/** URL de tile OSM (uso leve de preview — atribuir © OpenStreetMap). */
export const urlTileOsm = (z: number, x: number, y: number): string => {
  const n = 2 ** z;
  const xWrap = ((x % n) + n) % n;
  return `https://tile.openstreetmap.org/${z}/${xWrap}/${y}.png`;
};
