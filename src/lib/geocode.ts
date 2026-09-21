import { normalizarQueryGeocode, tokensFortesGeocode } from "./geocode-query";
import {
  sugestaoEstaNoSul,
  viewboxNominatimSul,
} from "./regiao-sul";

export type SugestaoEndereco = {
  label: string;
  lat: number;
  lng: number;
};

export type EstiloLabelGeocode = "completo" | "curto";

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  suburb?: string;
  neighbourhood?: string;
  road?: string;
  state?: string;
  "ISO3166-2-lvl4"?: string;
};

type NominatimReverse = {
  display_name?: string;
  address?: NominatimAddress;
};

type NominatimSearch = {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  class?: string;
  type?: string;
  address?: NominatimAddress;
};

const NOMINATIM = "https://nominatim.openstreetmap.org";
const LIMITE_BUSCA = 5;
const LIMITE_NOMINATIM = 8;

const headersNominatim = {
  Accept: "application/json",
  "Accept-Language": "pt-BR",
};

const TIMEOUT_NOMINATIM_MS = 8000;

const fetchNominatim = async (url: string): Promise<Response> =>
  fetch(url, {
    headers: headersNominatim,
    signal: AbortSignal.timeout(TIMEOUT_NOMINATIM_MS),
  });

const montarLabelCurto = (
  address?: NominatimAddress,
  displayName?: string,
): string => {
  if (!address) {
    return displayName?.split(",")[0]?.trim() || "Sua localização";
  }
  const local =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.county ||
    address.road;
  const uf = address["ISO3166-2-lvl4"]?.split("-")[1];
  if (local && uf) return `${local}, ${uf}`;
  if (local && address.state) return `${local}, ${address.state}`;
  if (local) return local;
  return displayName?.split(",").slice(0, 2).join(", ").trim() || "Sua localização";
};

const montarLabelCompleto = (
  address?: NominatimAddress,
  displayName?: string,
  name?: string,
): string => {
  const nome = name?.trim() || displayName?.split(",")[0]?.trim();
  const bairro = address?.suburb || address?.neighbourhood;
  const cidade =
    address?.city ||
    address?.town ||
    address?.village ||
    address?.municipality;
  const uf = address?.["ISO3166-2-lvl4"]?.split("-")[1];
  const partes: string[] = [];
  if (nome) partes.push(nome);
  if (bairro && bairro !== nome) partes.push(bairro);
  if (cidade && cidade !== nome && cidade !== bairro) {
    partes.push(uf ? `${cidade} - ${uf}` : cidade);
  } else if (uf && !partes.some((parte) => parte.includes(uf))) {
    partes.push(uf);
  }
  return partes.join(", ") || displayName?.trim() || "Sua localização";
};

const montarLabel = (
  estilo: EstiloLabelGeocode,
  address?: NominatimAddress,
  displayName?: string,
  name?: string,
): string => {
  if (estilo === "curto") {
    return montarLabelCurto(address, displayName);
  }
  return montarLabelCompleto(address, displayName, name);
};

type OpcoesGeocode = {
  estiloLabel?: EstiloLabelGeocode;
  /** Cadastro (padrão): viewbox Sul + filtro UF. Feed passa false. */
  restritoSul?: boolean;
};

const urlBuscaNominatim = (termo: string, restritoSul: boolean): string => {
  const params = new URLSearchParams({
    format: "json",
    q: termo,
    addressdetails: "1",
    limit: String(LIMITE_NOMINATIM),
    countrycodes: "br",
  });
  if (restritoSul) {
    params.set("viewbox", viewboxNominatimSul());
    params.set("bounded", "1");
  }
  return `${NOMINATIM}/search?${params.toString()}`;
};

const pesoPoi = (item: NominatimSearch): number => {
  if (item.type === "fuel") return 0;
  if (item.class === "amenity" || item.class === "shop") return 1;
  if (item.class === "building") return 3;
  if (item.class === "highway") return 4;
  return 2;
};

const mapearHits = (
  data: NominatimSearch[],
  estilo: EstiloLabelGeocode,
  restritoSul: boolean,
): SugestaoEndereco[] => {
  const ordenados = [...data].sort((a, b) => pesoPoi(a) - pesoPoi(b));
  const vistos = new Set<string>();
  const itens: SugestaoEndereco[] = [];
  for (const item of ordenados) {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (restritoSul && !sugestaoEstaNoSul(item.address, lat, lng)) continue;
    const chave = `${lat.toFixed(5)}|${lng.toFixed(5)}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    itens.push({
      label: montarLabel(estilo, item.address, item.display_name, item.name),
      lat,
      lng,
    });
    if (itens.length >= LIMITE_BUSCA) break;
  }
  return itens;
};

const consultarBusca = async (
  termo: string,
  estilo: EstiloLabelGeocode,
  restritoSul: boolean,
): Promise<SugestaoEndereco[]> => {
  const res = await fetchNominatim(urlBuscaNominatim(termo, restritoSul));
  if (!res.ok) return [];
  const data = (await res.json()) as NominatimSearch[];
  if (!Array.isArray(data)) return [];
  return mapearHits(data, estilo, restritoSul);
};

export const geocodeService = {
  reverso: async (
    lat: number,
    lng: number,
    opcoes?: OpcoesGeocode,
  ): Promise<string> => {
    const estilo = opcoes?.estiloLabel ?? "completo";
    const zoom = estilo === "curto" ? 10 : 18;
    try {
      const url =
        `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}` +
        `&zoom=${zoom}&addressdetails=1`;
      const res = await fetchNominatim(url);
      if (!res.ok) return "Sua localização";
      const data = (await res.json()) as NominatimReverse;
      return montarLabel(estilo, data.address, data.display_name);
    } catch {
      return "Sua localização";
    }
  },

  buscar: async (
    q: string,
    opcoes?: OpcoesGeocode,
  ): Promise<SugestaoEndereco[]> => {
    const termo = q.trim();
    if (termo.length < 3) return [];
    const estilo = opcoes?.estiloLabel ?? "completo";
    const restritoSul = opcoes?.restritoSul ?? true;
    try {
      const primeira = await consultarBusca(termo, estilo, restritoSul);
      if (primeira.length > 0) return primeira;
      const fortes = tokensFortesGeocode(termo);
      if (fortes.length < 3 || fortes === normalizarQueryGeocode(termo)) {
        return [];
      }
      return consultarBusca(fortes, estilo, restritoSul);
    } catch {
      return [];
    }
  },
};
