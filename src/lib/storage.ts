import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "./firebase";

/** Limite de upload de fotos (perfil, capa de rolê, flyer de evento e fachada). */
export const MAX_FOTO_MB = 10;
export const MAX_FOTO_BYTES = MAX_FOTO_MB * 1024 * 1024;
export const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png"];
export const ERRO_FOTO_GRANDE = `A foto deve ter no máximo ${MAX_FOTO_MB}MB.`;

export const uploadFotoPerfil = async (
  uid: string,
  file: File
): Promise<string> => {
  const storageRef = ref(storage, `avatars/${uid}.jpg`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const uploadFotoCapaRole = async (
  uid: string,
  file: File
): Promise<string> => {
  const id = crypto.randomUUID();
  const storageRef = ref(storage, `roles/capas/${uid}/${id}.jpg`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const uploadFotoFachadaLocal = async (
  uid: string,
  file: File
): Promise<string> => {
  const id = crypto.randomUUID();
  const storageRef = ref(storage, `locais/fachadas/${uid}/${id}.jpg`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const uploadFotoCapaEvento = async (
  uid: string,
  file: File
): Promise<string> => {
  const id = crypto.randomUUID();
  const storageRef = ref(storage, `eventos/capas/${uid}/${id}.jpg`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const uploadFotoAvaliacao = async (
  uid: string,
  alvoTipo: "local" | "evento",
  alvoId: string,
  file: File,
): Promise<string> => {
  const id = crypto.randomUUID();
  const storageRef = ref(
    storage,
    `avaliacoes/${alvoTipo}/${alvoId}/${uid}/${id}.jpg`,
  );
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
