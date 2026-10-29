import {log} from "../log";

const RECURSO =
  /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;
const PLACE_ID = /^[A-Za-z0-9_-]{4,200}$/;
const MAX_BYTES = 8 * 1024 * 1024;
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);

export type FotoPlaces = {
  recurso: string;
  atribuicao: string;
};

type Atribuicao = {displayName?: string};

type FotoBruta = {
  name?: string;
  authorAttributions?: Atribuicao[];
};

export const recursoFotoValido = (valor: string): boolean =>
  valor.length <= 1200 && RECURSO.test(valor);

const atribuicaoDe = (itens: Atribuicao[] | undefined): string => {
  const nomes = (itens ?? [])
    .map((item) => (item.displayName ?? "").replace(/\s+/g, " ").trim())
    .filter((nome) => nome.length > 0 && nome.length <= 80)
    .slice(0, 2);
  return nomes.join(" · ");
};

export const fotoDoLugar = (photos: FotoBruta[] | undefined): FotoPlaces => {
  const recurso = photos?.[0]?.name ?? "";
  if (!recursoFotoValido(recurso)) {
    return {recurso: "", atribuicao: ""};
  }
  return {
    recurso,
    atribuicao: atribuicaoDe(photos?.[0]?.authorAttributions) || "Google",
  };
};

export const buscarFotoDoLugar = async (
  chave: string,
  placeId: string,
): Promise<FotoPlaces | null> => {
  if (!PLACE_ID.test(placeId)) {
    return null;
  }
  let resposta: Response;
  try {
    resposta = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": chave,
        "X-Goog-FieldMask": "photos",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return null;
  }
  if (!resposta.ok) {
    return null;
  }
  const corpo = (await resposta.json()) as {photos?: FotoBruta[]};
  return fotoDoLugar(corpo.photos);
};

export const baixarFotoPlaces = async (
  chave: string,
  recurso: string,
): Promise<{bytes: Buffer; contentType: string} | null> => {
  if (!recursoFotoValido(recurso)) {
    return null;
  }
  const url = [
    "https://places.googleapis.com/v1/",
    recurso,
    "/media?maxHeightPx=1200&maxWidthPx=1200",
  ].join("");
  let resposta: Response;
  try {
    resposta = await fetch(url, {
      headers: {"X-Goog-Api-Key": chave},
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    return null;
  }
  if (!resposta.ok) {
    log.warn("SugestaoLocal", "Places não devolveu a foto", {
      status: resposta.status,
    });
    return null;
  }
  const contentType = (resposta.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!TIPOS.has(contentType)) {
    return null;
  }
  const bytes = Buffer.from(await resposta.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return null;
  }
  return {bytes, contentType};
};
