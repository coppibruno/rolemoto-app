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

export const uploadFotoRole = async (
  roleId: string,
  file: File
): Promise<string> => {
  const storageRef = ref(storage, `roles/${roleId}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
