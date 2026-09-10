import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "./firebase";

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
