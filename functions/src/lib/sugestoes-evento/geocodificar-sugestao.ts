export type PontoGeo = {
  lat: number;
  lng: number;
  endereco: string;
};

type ItemNominatim = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

export const geocodificarConsulta = async (
  consulta: string,
): Promise<PontoGeo | null> => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("q", consulta);
  const resposta = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "pt-BR",
      "User-Agent": "RolemotoApp/1.0 (sugestoes-eventos)",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!resposta.ok) {
    return null;
  }
  const dados = (await resposta.json()) as ItemNominatim[];
  const item = dados[0];
  if (!item?.lat || !item.lon) {
    return null;
  }
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const endereco = (item.display_name ?? consulta).replace(/\s+/g, " ").trim();
  return {lat, lng, endereco: endereco.slice(0, 300)};
};
