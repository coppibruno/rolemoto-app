export type PontoMaps = {
  lat?: number | null;
  lng?: number | null;
  endereco: string;
  nome?: string;
};

/** URL universal — no Android/iOS costuma oferecer abrir no app de Maps. */
export const urlAbrirMaps = (ponto: PontoMaps): string => {
  const temCoord =
    typeof ponto.lat === "number" &&
    typeof ponto.lng === "number" &&
    Number.isFinite(ponto.lat) &&
    Number.isFinite(ponto.lng);

  if (temCoord) {
    return `https://www.google.com/maps/search/?api=1&query=${ponto.lat},${ponto.lng}`;
  }

  const q = (ponto.nome?.trim() || ponto.endereco).trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};
