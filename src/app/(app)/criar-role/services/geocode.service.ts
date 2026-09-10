export type SugestaoEndereco = {
  label: string;
  lat: number;
  lng: number;
};

type NominatimSearch = {
  lat: string;
  lon: string;
  display_name: string;
};

type NominatimReverse = {
  display_name?: string;
};

const NOMINATIM = "https://nominatim.openstreetmap.org";

const headersNominatim = {
  Accept: "application/json",
  "Accept-Language": "pt-BR",
};

export const geocodeService = {
  reverso: async (lat: number, lng: number): Promise<string> => {
    try {
      const url =
        `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}` +
        "&zoom=18&addressdetails=1";
      const res = await fetch(url, { headers: headersNominatim });
      if (!res.ok) return "Sua localização";
      const data = (await res.json()) as NominatimReverse;
      return data.display_name?.trim() || "Sua localização";
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
        label: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      }));
    } catch {
      return [];
    }
  },
};
