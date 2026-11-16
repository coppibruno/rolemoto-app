/** Regras puras do álbum do fotógrafo (SPEC 065). Sem Firestore. */

export const TETO_ALBUNS_EVENTO = 5;
export const MAX_URL_ALBUM = 2048;

export type ResultadoUrlAlbum =
  | {ok: true; url: string}
  | {ok: false; erro: string};

/** Trim; só https absoluto com host; máx. 2048. */
export const validarUrlAlbum = (bruto: unknown): ResultadoUrlAlbum => {
  if (typeof bruto !== "string") {
    return {ok: false, erro: "informe um link https válido"};
  }
  const url = bruto.trim();
  if (!url || url.length > MAX_URL_ALBUM) {
    return {ok: false, erro: "informe um link https válido"};
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {ok: false, erro: "informe um link https válido"};
  }
  if (parsed.protocol !== "https:" || !parsed.hostname) {
    return {ok: false, erro: "informe um link https válido"};
  }
  return {ok: true, url: parsed.href};
};

/** Push só na 1ª publicação (zero álbuns e ainda não notificado). */
export const deveNotificarAlbum = (
  albunsAntes: number,
  albumNotificado: boolean,
): boolean => albunsAntes === 0 && albumNotificado === false;

export const fraseAlbum = (apelido: string, titulo: string): string => {
  const nome = apelido.trim() || "Alguém";
  const evento = titulo.trim() || "o evento";
  return `${nome} adicionou as fotos de ${evento}`;
};

export const podePublicarAlbum = (
  uid: string,
  fotografoId: string | null,
  admin: boolean,
): boolean => admin || (Boolean(fotografoId) && fotografoId === uid);

export const dominioAlbum = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
