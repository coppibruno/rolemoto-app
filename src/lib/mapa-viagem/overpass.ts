import type { Coord, Retangulo } from "./viagem";
import type { PontoNomeado } from "./tipos";

export const URL_OVERPASS = "https://overpass-api.de/api/interpreter";
export const TIMEOUT_OVERPASS_MS = 20_000;
export const MAX_POSTOS = 80;
export const MAX_CIDADES = 40;

type ElementoOverpass = {
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const PESO_PLACE: Record<string, number> = { city: 0, town: 1, village: 2 };

export const consultaOverpass = (retangulos: Retangulo[]): string => {
  const caixas = retangulos.map(
    (r) =>
      `${r.latMin.toFixed(4)},${r.lngMin.toFixed(4)},${r.latMax.toFixed(4)},${r.lngMax.toFixed(4)}`,
  );
  const blocos = caixas
    .map(
      (b) =>
        `nwr["amenity"="fuel"](${b});node["place"~"^(city|town|village)$"](${b});`,
    )
    .join("");
  return `[out:json][timeout:20];(${blocos});out center 600;`;
};

/** Distância aproximada (km) do ponto até o traço reto da viagem. */
export const distanciaAoTracoKm = (p: Coord, traco: Coord[]): number => {
  const kmLat = 111;
  const kmLng = 111 * Math.cos((p.lat * Math.PI) / 180);
  let menor = Infinity;
  for (let i = 1; i < traco.length; i++) {
    const ax = (traco[i - 1].lng - p.lng) * kmLng;
    const ay = (traco[i - 1].lat - p.lat) * kmLat;
    const bx = (traco[i].lng - p.lng) * kmLng;
    const by = (traco[i].lat - p.lat) * kmLat;
    const dx = bx - ax;
    const dy = by - ay;
    const comprimento = dx * dx + dy * dy;
    const t = comprimento === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / comprimento));
    menor = Math.min(menor, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return menor;
};

const posicao = (e: ElementoOverpass): Coord | null => {
  const lat = e.lat ?? e.center?.lat;
  const lng = e.lon ?? e.center?.lon;
  return typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;
};

export const separarPostosECidades = (
  elementos: ElementoOverpass[],
  traco: Coord[],
): { postos: PontoNomeado[]; cidades: PontoNomeado[] } => {
  const vistos = new Set<string>();
  const postos: (PontoNomeado & { d: number })[] = [];
  const cidades: (PontoNomeado & { d: number; peso: number })[] = [];
  for (const e of elementos) {
    const p = posicao(e);
    if (!p) continue;
    const chave = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    const tags = e.tags ?? {};
    const d = distanciaAoTracoKm(p, traco);
    if (tags.amenity === "fuel") {
      postos.push({ nome: (tags.name || tags.brand || "").trim() || "Posto", ...p, d });
    } else if (tags.place in PESO_PLACE && tags.name) {
      cidades.push({ nome: tags.name.trim(), ...p, d, peso: PESO_PLACE[tags.place] });
    }
  }
  postos.sort((a, b) => a.d - b.d);
  cidades.sort((a, b) => a.peso - b.peso || a.d - b.d);
  const limpar = ({ nome, lat, lng }: PontoNomeado): PontoNomeado => ({ nome, lat, lng });
  return {
    postos: postos.slice(0, MAX_POSTOS).map(limpar),
    cidades: cidades.slice(0, MAX_CIDADES).map(limpar),
  };
};

/** Falha ou demora acima de 20 s devolve listas vazias: o mapa continua valendo. */
export const buscarPostosECidades = async (
  retangulos: Retangulo[],
  traco: Coord[],
): Promise<{ postos: PontoNomeado[]; cidades: PontoNomeado[] }> => {
  const controle = new AbortController();
  const id = window.setTimeout(() => controle.abort(), TIMEOUT_OVERPASS_MS);
  try {
    const res = await fetch(URL_OVERPASS, {
      method: "POST",
      body: new URLSearchParams({ data: consultaOverpass(retangulos) }),
      signal: controle.signal,
    });
    if (!res.ok) return { postos: [], cidades: [] };
    const json = (await res.json()) as { elements?: ElementoOverpass[] };
    return separarPostosECidades(json.elements ?? [], traco);
  } catch {
    return { postos: [], cidades: [] };
  } finally {
    window.clearTimeout(id);
  }
};
