/**
 * Recorte SC / PR / RS (SPEC 032).
 * Bbox aproximado — pode incluir faixa de borda de outro estado no MVP.
 */
export const BBOX_SUL = {
  latMin: -34.0,
  latMax: -22.0,
  lngMin: -57.5,
  lngMax: -48.0,
} as const;

/** Blumenau, SC — centro default quando o GPS não está no Sul. */
export const CENTRO_SUL_DEFAULT: [number, number] = [-26.9189, -49.0661];

export const ZOOM_SUL_REGIAO = 7;
export const ZOOM_SUL_GPS = 13;

export const UFS_SUL_ISO = ["BR-SC", "BR-PR", "BR-RS"] as const;

export const ERRO_FORA_DO_SUL = "Só cadastramos pontos em SC, PR e RS";

const ESTADOS_SUL = new Set([
  "santa catarina",
  "parana",
  "rio grande do sul",
]);

const semAcento = (texto: string): string =>
  texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export const pontoEstaNoSul = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= BBOX_SUL.latMin &&
  lat <= BBOX_SUL.latMax &&
  lng >= BBOX_SUL.lngMin &&
  lng <= BBOX_SUL.lngMax;

export const enderecoEstaNoSul = (address?: {
  state?: string;
  "ISO3166-2-lvl4"?: string;
}): boolean => {
  const iso = address?.["ISO3166-2-lvl4"];
  if (iso && (UFS_SUL_ISO as readonly string[]).includes(iso)) {
    return true;
  }
  if (!address?.state) return false;
  return ESTADOS_SUL.has(semAcento(address.state));
};

export const sugestaoEstaNoSul = (
  address: { state?: string; "ISO3166-2-lvl4"?: string } | undefined,
  lat: number,
  lng: number,
): boolean => {
  if (address?.state || address?.["ISO3166-2-lvl4"]) {
    return enderecoEstaNoSul(address);
  }
  return pontoEstaNoSul(lat, lng);
};

/** viewbox Nominatim: minLon,maxLat,maxLon,minLat */
export const viewboxNominatimSul = (): string =>
  `${BBOX_SUL.lngMin},${BBOX_SUL.latMax},${BBOX_SUL.lngMax},${BBOX_SUL.latMin}`;
