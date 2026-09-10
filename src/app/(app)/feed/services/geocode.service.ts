export type SugestaoEndereco = {
  label: string;
  lat: number;
  lng: number;
};

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  suburb?: string;
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
  address?: NominatimAddress;
};

const NOMINATIM = "https://nominatim.openstreetmap.org";

const montarLabel = (
  address?: NominatimAddress,
  displayName?: string
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

const headersNominatim = {
  Accept: "application/json",
  "Accept-Language": "pt-BR",
};

export const geocodeService = {
  reverso: async (lat: number, lng: number): Promise<string> => {
    try {
      const url =
        `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}` +
        "&zoom=10&addressdetails=1";
      const res = await fetch(url, { headers: headersNominatim });
      if (!res.ok) return "Sua localização";
      const data = (await res.json()) as NominatimReverse;
      return montarLabel(data.address, data.display_name);
    } catch {
      return "Sua localização";
    }
  },

  buscar: async (q: string): Promise<SugestaoEndereco[]> => {
    const termo = q.trim();
    if (termo.length < 3) return [];
    try {
      const url =
        `${NOMINATIM}/search?format=json&q=${encodeURIComponent(termo)}` +
        "&addressdetails=1&limit=5&countrycodes=br";
      const res = await fetch(url, { headers: headersNominatim });
      if (!res.ok) return [];
      const data = (await res.json()) as NominatimSearch[];
      return data.map((item) => ({
        label: montarLabel(item.address, item.display_name),
        lat: Number(item.lat),
        lng: Number(item.lon),
      }));
    } catch {
      return [];
    }
  },
};
