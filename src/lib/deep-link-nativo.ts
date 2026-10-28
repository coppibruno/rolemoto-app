import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// getLaunchUrl devolve a mesma URL a cada reload do WebView; sem isso vira loop.
const CHAVE_LAUNCH_TRATADA = "rolemoto.deepLink.launchTratada";
const HOSTS_APP = new Set(["www.rolemoto.com.br", "rolemoto.com.br"]);

let iniciado = false;

export const caminhoRelativo = (url: unknown): string => {
  if (typeof url !== "string" || !url.trim()) {
    return "/";
  }
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed, window.location.origin);
    const mesmoApp =
      parsed.origin === window.location.origin || HOSTS_APP.has(parsed.hostname);
    if (mesmoApp) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // URL absoluta de outro origin — ignora
  }
  return "/";
};

const caminhoAtual = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

export const navegarNoWebView = (url: unknown) => {
  if (typeof window === "undefined") {
    return;
  }
  const caminho = caminhoRelativo(url);
  if (caminho === caminhoAtual()) {
    return;
  }
  window.location.assign(caminho);
};

const tratarLaunchUrl = async () => {
  try {
    const launch = await App.getLaunchUrl();
    if (!launch?.url) {
      return;
    }
    if (sessionStorage.getItem(CHAVE_LAUNCH_TRATADA) === launch.url) {
      return;
    }
    sessionStorage.setItem(CHAVE_LAUNCH_TRATADA, launch.url);
    const caminho = caminhoRelativo(launch.url);
    if (caminho !== "/") {
      navegarNoWebView(caminho);
    }
  } catch {
    // launch URL ausente não bloqueia a abertura do app
  }
};

/** App Links: link aberto com app morto (launch URL) ou já aberto (appUrlOpen). */
export const iniciarDeepLinksNativos = () => {
  if (iniciado || !Capacitor.isNativePlatform()) {
    return;
  }
  iniciado = true;
  void App.addListener("appUrlOpen", ({ url }) => {
    navegarNoWebView(url);
  });
  void tratarLaunchUrl();
};
