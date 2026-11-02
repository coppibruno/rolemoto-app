import {randomUUID} from "crypto";
import {adminStorage} from "../firebase-admin";

const BUCKET = "rolemoto-bc47f.firebasestorage.app";

const urlDownload = (caminho: string, token: string): string => {
  const encoded = encodeURIComponent(caminho);
  const emulador = process.env.FIREBASE_STORAGE_EMULATOR_HOST?.trim();
  if (emulador) {
    const host = emulador
      .replace(/^https?:\/\//, "")
      .replace(/^0\.0\.0\.0/, "127.0.0.1");
    return `http://${host}/v0/b/${BUCKET}/o/${encoded}?alt=media&token=${token}`;
  }
  return [
    "https://firebasestorage.googleapis.com/v0/b/",
    BUCKET,
    "/o/",
    encoded,
    "?alt=media&token=",
    token,
  ].join("");
};

const gravarFoto = async (
  caminho: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> => {
  const token = randomUUID();
  await adminStorage.bucket(BUCKET).file(caminho).save(bytes, {
    resumable: false,
    metadata: {
      contentType,
      metadata: {firebaseStorageDownloadTokens: token},
    },
  });
  return urlDownload(caminho, token);
};

export const salvarFotoFachada = async (
  placeId: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> => {
  const caminho = `locais/fachadas/sugestoes/${placeId}.jpg`;
  return gravarFoto(caminho, bytes, contentType);
};

/** Foto extra da galeria. O nome estável evita baixar de novo se o script rodar outra vez. */
export const caminhoFotoExtra = (placeId: string, fotoId: string): string =>
  `locais/fachadas/sugestoes/${placeId}--${fotoId}.jpg`;

export const salvarFotoExtra = async (
  placeId: string,
  fotoId: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> =>
  gravarFoto(caminhoFotoExtra(placeId, fotoId), bytes, contentType);

/** URL já gravada, sem nova chamada à Places. `null` se o arquivo não existe. */
export const urlFotoExistente = async (caminho: string): Promise<string | null> => {
  const file = adminStorage.bucket(BUCKET).file(caminho);
  const [exists] = await file.exists();
  if (!exists) {
    return null;
  }
  const [meta] = await file.getMetadata();
  const bruto = meta.metadata?.firebaseStorageDownloadTokens;
  const token = typeof bruto === "string" ? (bruto.split(",")[0] ?? "").trim() : "";
  if (!token) {
    return null;
  }
  return urlDownload(caminho, token);
};
