import {randomUUID} from "crypto";
import {adminStorage} from "../firebase-admin";

const BUCKET = "rolemoto-bc47f.firebasestorage.app";

export const salvarFotoFachada = async (
  placeId: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> => {
  const token = randomUUID();
  const caminho = `locais/fachadas/sugestoes/${placeId}.jpg`;
  await adminStorage.bucket(BUCKET).file(caminho).save(bytes, {
    resumable: false,
    metadata: {
      contentType,
      metadata: {firebaseStorageDownloadTokens: token},
    },
  });
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
