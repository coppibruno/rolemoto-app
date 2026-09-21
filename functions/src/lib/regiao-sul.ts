/**
 * Recorte SC / PR / RS (SPEC 032).
 * Bbox aproximado — pode incluir faixa de borda de outro estado no MVP.
 */
export const ERRO_LOCALIZACAO_FORA_DO_SUL =
  "Localização deve estar em SC, PR ou RS";

const LAT_MIN = -34.0;
const LAT_MAX = -22.0;
const LNG_MIN = -57.5;
const LNG_MAX = -48.0;

export const pontoEstaNoSul = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= LAT_MIN &&
  lat <= LAT_MAX &&
  lng >= LNG_MIN &&
  lng <= LNG_MAX;
