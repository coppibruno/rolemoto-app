import {randomUUID} from "crypto";
import {adminStorage} from "./firebase-admin";

const urlDownload = (bucket: string, caminho: string, token: string): string => {
  const encoded = encodeURIComponent(caminho);
  const emulador = process.env.FIREBASE_STORAGE_EMULATOR_HOST?.trim();
  if (emulador) {
    const host = emulador
      .replace(/^https?:\/\//, "")
      .replace(/^0\.0\.0\.0/, "127.0.0.1");
    return `http://${host}/v0/b/${bucket}/o/${encoded}?alt=media&token=${token}`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media&token=${token}`;
};

/** Arquivo próprio em `stories/perfil/{uid}/`: expirar a story e apagar o post não se cruzam. */
export const copiarParaStoryPerfil = async (
  origem: string,
  uid: string,
): Promise<{fotoUrl: string; storagePath: string}> => {
  const bucket = adminStorage.bucket();
  const fonte = bucket.file(origem);
  const [[bytes], [meta]] = await Promise.all([fonte.download(), fonte.getMetadata()]);
  const ext = origem.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `stories/perfil/${uid}/${randomUUID()}.${ext}`;
  const token = randomUUID();
  await bucket.file(storagePath).save(bytes, {
    resumable: false,
    metadata: {
      contentType: meta.contentType || "image/jpeg",
      metadata: {firebaseStorageDownloadTokens: token},
    },
  });
  return {fotoUrl: urlDownload(bucket.name, storagePath, token), storagePath};
};
