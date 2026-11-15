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

const coord = (p: PontoMaps): string | null => {
  if (
    typeof p.lat === "number" &&
    typeof p.lng === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng)
  ) {
    return `${p.lat},${p.lng}`;
  }
  return null;
};

/**
 * Saída, paradas e destino no caminho da URL, de carro (`!3e0`). O app do Maps
 * descarta `waypoints` e `travelmode` da query; no caminho, mantém as paradas e a estrada.
 */
export const urlViagemMaps = (pontos: PontoMaps[]): string => {
  const origem = pontos[0];
  const destino = pontos[pontos.length - 1];
  if (!origem || !destino) return "https://www.google.com/maps";
  if (pontos.length < 2 || !coord(origem) || !coord(destino)) return urlAbrirMaps(destino);
  const caminho = pontos.map(coord).filter((c): c is string => c !== null);
  return `https://www.google.com/maps/dir/${caminho.join("/")}/data=!3e0`;
};

export const urlRotaMaps = (origem: PontoMaps, destino: PontoMaps): string => {
  const a = coord(origem);
  const b = coord(destino);
  if (a && b) {
    return `https://www.google.com/maps/dir/?api=1&origin=${a}&destination=${b}`;
  }
  return urlAbrirMaps(destino);
};
