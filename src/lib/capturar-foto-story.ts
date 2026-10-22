import {
  Camera,
  CameraDirection,
  EncodingType,
} from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

/** APK sem `@capacitor/camera` sincronizado cai no `<input capture>`. */
export const cameraStoryDisponivel = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Camera");

export const foiCancelamentoCaptura = (erro: unknown): boolean => {
  const msg = String(
    (erro as { message?: string })?.message ?? erro ?? "",
  ).toLowerCase();
  return (
    msg.includes("cancel") ||
    msg.includes("canceled") ||
    msg.includes("cancelled") ||
    msg.includes("user denied")
  );
};

/**
 * Abre a câmera nativa (traseira) e devolve um `File` JPEG/PNG.
 * Só chamar quando `cameraStoryDisponivel()` for true.
 */
export const capturarFotoStory = async (): Promise<File> => {
  const foto = await Camera.takePhoto({
    quality: 90,
    encodingType: EncodingType.JPEG,
    cameraDirection: CameraDirection.Rear,
    saveToGallery: false,
    correctOrientation: true,
  });

  const url =
    foto.webPath ??
    (foto.uri ? Capacitor.convertFileSrc(foto.uri) : "");
  if (!url) {
    throw new Error("foto vazia");
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("foto inacessivel");
  }
  const blob = await res.blob();
  const type = blob.type === "image/png" ? "image/png" : "image/jpeg";
  const ext = type === "image/png" ? "png" : "jpg";
  return new File([blob], `story-${Date.now()}.${ext}`, { type });
};
