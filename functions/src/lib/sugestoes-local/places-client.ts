import type {SementeLocal} from "./sementes";
import {PlacesConsultaError} from "./erros";
import {montarHorarioPlaces, type HorarioPlaces} from "./horario-places";
import type {LugarCandidato} from "./escolher-sugestoes-local";
import {fotoDoLugar} from "./foto-places";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.editorialSummary",
  "places.googleMapsUri",
  "places.regularOpeningHours",
  "places.reviews",
  "places.photos",
].join(",");

type LugarPlaces = {
  id?: string;
  displayName?: {text?: string};
  formattedAddress?: string;
  location?: {latitude?: number; longitude?: number};
  types?: string[];
  editorialSummary?: {text?: string};
  googleMapsUri?: string;
  regularOpeningHours?: HorarioPlaces;
  reviews?: Array<{text?: {text?: string}}>;
  photos?: Array<{
    name?: string;
    authorAttributions?: Array<{displayName?: string}>;
  }>;
};

const idLugar = (valor: string | undefined): string => {
  const limpo = (valor ?? "").replace(/^places\//, "").trim();
  if (!/^[A-Za-z0-9_-]{4,200}$/.test(limpo)) {
    return "";
  }
  return limpo;
};

const linkMapsDe = (uri: string | undefined, lat: number, lng: number): string => {
  if (uri && uri.length <= 500) {
    try {
      const url = new URL(uri);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return uri;
      }
    } catch {
      /* cai no link curto */
    }
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};

const tiposDe = (valor: string[] | undefined): string[] =>
  (valor ?? []).filter((tipo) => typeof tipo === "string");

const mapearLugar = (lugar: LugarPlaces): LugarCandidato | null => {
  const placeId = idLugar(lugar.id);
  const nome = (lugar.displayName?.text ?? "").trim().slice(0, 80);
  const lat = lugar.location?.latitude;
  const lng = lugar.location?.longitude;
  if (!placeId || nome.length < 3 || typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }
  const enderecoBruto = (lugar.formattedAddress ?? "").trim();
  const endereco = enderecoBruto.length >= 3 ? enderecoBruto : `${lat}, ${lng}`;
  const horario = montarHorarioPlaces(lugar.regularOpeningHours);
  const foto = fotoDoLugar(lugar.photos);
  const avaliacoes = (lugar.reviews ?? [])
    .map((review) => review.text?.text ?? "")
    .filter((texto) => texto.trim().length > 0)
    .slice(0, 5);

  return {
    placeId,
    nome,
    endereco,
    lat,
    lng,
    tipos: tiposDe(lugar.types),
    resumo: lugar.editorialSummary?.text ?? "",
    avaliacoes,
    linkMaps: linkMapsDe(lugar.googleMapsUri, lat, lng),
    aberto24h: horario.aberto24h,
    horarios: horario.horarios,
    horarioCompleto: horario.horarioCompleto,
    fotoRecurso: foto.recurso,
    fotoAtribuicao: foto.atribuicao,
  };
};

export const buscarLugaresPlaces = async (
  chave: string,
  consulta: string,
  semente: SementeLocal,
  tipo?: string,
): Promise<LugarCandidato[]> => {
  const pedido: Record<string, unknown> = {
    textQuery: consulta,
    languageCode: "pt-BR",
    regionCode: "BR",
    pageSize: 10,
    locationBias: {
      circle: {
        center: {latitude: semente.lat, longitude: semente.lng},
        radius: semente.raioKm * 1000,
      },
    },
  };
  if (tipo) {
    pedido.includedType = tipo;
    pedido.strictTypeFiltering = true;
  }
  let resposta: Response;
  try {
    resposta = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": chave,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(pedido),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new PlacesConsultaError();
  }

  if (!resposta.ok) {
    throw new PlacesConsultaError();
  }

  const corpo = (await resposta.json()) as {places?: LugarPlaces[]};
  return (corpo.places ?? [])
    .map(mapearLugar)
    .filter((lugar): lugar is LugarCandidato => lugar !== null);
};
