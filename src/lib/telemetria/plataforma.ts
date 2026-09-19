import { Capacitor } from "@capacitor/core";

export const podeGravarTelemetriaNativa = (): boolean => {
  if (typeof window === "undefined") return false;
  return Capacitor.isNativePlatform();
};
