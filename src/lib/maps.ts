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

/** Saída, paradas e destino nessa ordem. Sem parada, a mesma URL de origem e destino. */
export const urlViagemMaps = (pontos: PontoMaps[]): string => {
  const origem = pontos[0];
  const destino = pontos[pontos.length - 1];
  const meio = pontos.slice(1, -1).map(coord);
  if (!origem || !destino || pontos.length < 3) {
    return urlRotaMaps(origem ?? destino, destino ?? origem);
  }
  const a = coord(origem);
  const b = coord(destino);
  if (!a || !b || meio.some((c) => c === null)) return urlRotaMaps(origem, destino);
  const waypoints = encodeURIComponent(meio.join("|"));
  return `https://www.google.com/maps/dir/?api=1&origin=${a}&destination=${b}&waypoints=${waypoints}&travelmode=driving`;
};

export const urlRotaMaps = (origem: PontoMaps, destino: PontoMaps): string => {
  const a = coord(origem);
  const b = coord(destino);
  if (a && b) {
    return `https://www.google.com/maps/dir/?api=1&origin=${a}&destination=${b}`;
  }
  return urlAbrirMaps(destino);
};
