import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

/** Chave lida pela página sem internet para voltar ao site. */
export const CHAVE_URL_SITE = "rolemoto.siteUrl";

export const noAppInstalado = (): boolean =>
  typeof window !== "undefined" && Capacitor.isNativePlatform();

export const urlPmtilesSul = (): string =>
  process.env.NEXT_PUBLIC_MAPA_OFFLINE_PMTILES_URL?.trim() ?? "";

export const lembrarUrlDoSite = async (): Promise<void> => {
  if (!noAppInstalado() || !window.location.origin.startsWith("http")) return;
  await Preferences.set({ key: CHAVE_URL_SITE, value: window.location.origin }).catch(() => undefined);
};
