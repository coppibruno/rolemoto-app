import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "./firebase";

export {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  MAX_FOTO_MB,
  TIPOS_FOTO_ACEITOS,
} from "./foto-limites";

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
  contentType = file.type || "image/jpeg",
): Promise<string> => {
  const id = crypto.randomUUID();
  const storageRef = ref(
    storage,
    `avaliacoes/${alvoTipo}/${alvoId}/${uid}/${id}.jpg`,
  );
  await uploadBytes(storageRef, file, { contentType });
  return getDownloadURL(storageRef);
};

export const uploadFotoPost = async (uid: string, file: File): Promise<string> => {
  const id = crypto.randomUUID();
  const storageRef = ref(storage, `posts/${uid}/${id}.jpg`);
  await uploadBytes(storageRef, file, { contentType: file.type || "image/jpeg" });
  return getDownloadURL(storageRef);
};

export const uploadFotoStory = async (
  album: "local" | "evento" | "perfil",
  alvoId: string,
  uid: string,
  file: File,
): Promise<string> => {
  const id = crypto.randomUUID();
  const pasta = album === "local" ? "stories/locais" : album === "evento" ? "stories/eventos" : "stories/perfil";
  const caminho = album === "perfil" ? `${pasta}/${uid}/${id}.jpg` : `${pasta}/${alvoId}/${uid}/${id}.jpg`;
  const storageRef = ref(storage, caminho);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
