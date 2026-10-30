import {randomUUID} from "crypto";
import {adminStorage} from "../firebase-admin";

const BUCKET = "rolemoto-bc47f.firebasestorage.app";
const MAX_BYTES = 8 * 1024 * 1024;
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);

const tipoDe = (header: string, url: string): string | null => {
  const base = header.split(";")[0].trim().toLowerCase();
  if (base === "image/jpg") {
    return "image/jpeg";
  }
  if (TIPOS.has(base)) {
    return base;
  }
  if (base === "application/octet-stream" || base === "") {
    if (url.includes(".png")) {
      return "image/png";
    }
    if (url.includes(".webp")) {
      return "image/webp";
    }
    if (/\.jpe?g(\?|$)/.test(url)) {
      return "image/jpeg";
    }
  }
  return null;
};

const baixar = async (
  url: string,
): Promise<{bytes: Buffer; contentType: string} | null> => {
  if (!url.startsWith("https://")) {
    return null;
  }
  const resposta = await fetch(url, {
    headers: {Accept: "image/*"},
    signal: AbortSignal.timeout(12000),
  });
  if (!resposta.ok) {
    return null;
  }
  const contentType = tipoDe(resposta.headers.get("content-type") ?? "", url);
  if (!contentType) {
    return null;
  }
  const bytes = Buffer.from(await resposta.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return null;
  }
  return {bytes, contentType};
};

export const salvarFotoEvento = async (
  id: string,
  urlOrigem: string,
): Promise<string> => {
  if (!urlOrigem.startsWith("https://")) {
    return "";
  }
  try {
    const arquivo = await baixar(urlOrigem);
    if (!arquivo) {
      return urlOrigem;
    }
    const token = randomUUID();
    const caminho = `eventos/capas/sugestoes/${id}.jpg`;
    await adminStorage.bucket(BUCKET).file(caminho).save(arquivo.bytes, {
      resumable: false,
      metadata: {
        contentType: arquivo.contentType,
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
  } catch {
    return urlOrigem;
  }
};
