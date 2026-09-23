import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { PushNotifications } from "@capacitor/push-notifications";
import { dispositivosService } from "@/app/(app)/services/dispositivos.service";
import type { PlataformaDispositivo } from "@/types/dispositivo";
import type { PayloadForeground, ResultadoPermissao } from "./fcm";

const CANAL_ID = "rolemoto_push";
const PREF_TOKEN = "rolemoto.fcm.tokenNativo";

export const ehNativo = () => Capacitor.isNativePlatform();

export const plataformaAtual = (): PlataformaDispositivo => {
  if (!ehNativo()) {
    return "web";
  }
  const p = Capacitor.getPlatform();
  if (p === "ios") {
    return "ios";
  }
  if (p === "android") {
    return "android";
  }
  return "web";
};

let recusouNestaSessao = false;
let tokenEmMemoria: string | null = null;
let listenersPromise: Promise<void> | null = null;
let onForeground: ((payload: PayloadForeground) => void) | null = null;

const guardarToken = async (token: string) => {
  tokenEmMemoria = token;
  await Preferences.set({ key: PREF_TOKEN, value: token });
};

export const obterTokenNativo = async (): Promise<string | null> => {
  if (tokenEmMemoria) {
    return tokenEmMemoria;
  }
  const { value } = await Preferences.get({ key: PREF_TOKEN });
  tokenEmMemoria = value;
  return value;
};

export const limparTokenNativoLocal = async () => {
  tokenEmMemoria = null;
  await Preferences.remove({ key: PREF_TOKEN });
};

const caminhoRelativo = (url: unknown): string => {
  if (typeof url !== "string" || !url.trim()) {
    return "/";
  }
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // URL absoluta de outro origin — ignora
  }
  return "/";
};

const navegarNoWebView = (url: unknown) => {
  if (typeof window === "undefined") {
    return;
  }
  window.location.assign(caminhoRelativo(url));
};

const textoDoCampo = (valor: unknown): string =>
  typeof valor === "string" ? valor : "";

const tituloDoPayload = (
  notification?: { title?: string; body?: string },
  data?: Record<string, unknown>,
): PayloadForeground => ({
  title: notification?.title || textoDoCampo(data?.title),
  body: notification?.body || textoDoCampo(data?.body),
});

const criarCanal = async () => {
  if (Capacitor.getPlatform() !== "android") {
    return;
  }
  try {
    await PushNotifications.createChannel({
      id: CANAL_ID,
      name: "Avisos do Rolemoto",
      description: "Pedidos de vaga, aceite, lembretes e cancelamentos",
      importance: 4,
      visibility: 1,
      vibration: true,
    });
  } catch (error) {
    console.warn("FCM nativo: falha ao criar canal", error);
  }
};

const tentarLaunchUrl = async () => {
  try {
    const launch = await App.getLaunchUrl();
    if (!launch?.url) {
      return;
    }
    const caminho = caminhoRelativo(launch.url);
    if (caminho !== "/") {
      navegarNoWebView(caminho);
    }
  } catch {
    // launch URL ausente não bloqueia o registro
  }
};

const instalarListeners = async () => {
  await PushNotifications.addListener("registration", (evento) => {
    const token = evento.value;
    if (!token) {
      return;
    }
    void guardarToken(token)
      .then(() => dispositivosService.registrar(token, plataformaAtual()))
      .catch(() => {
        console.warn("FCM nativo: falha ao registrar token");
      });
  });

  await PushNotifications.addListener("registrationError", (erro) => {
    console.warn("FCM nativo: falha no registro", erro.error);
  });

  await PushNotifications.addListener("pushNotificationReceived", (notificacao) => {
    const data = (notificacao.data ?? {}) as Record<string, unknown>;
    const { title, body } = tituloDoPayload(notificacao, data);
    if (!title || !onForeground) {
      return;
    }
    onForeground({ title, body });
  });

  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (acao) => {
      const data = (acao.notification.data ?? {}) as Record<string, unknown>;
      navegarNoWebView(data.url);
    },
  );

  await tentarLaunchUrl();
};

const garantirListeners = () => {
  if (!listenersPromise) {
    listenersPromise = instalarListeners();
  }
  return listenersPromise;
};

/** Liga actionPerformed cedo (app morto → toque na notificação) sem POST. */
export const iniciarListenersNativos = () => {
  if (!ehNativo()) {
    return;
  }
  void garantirListeners();
};

const registrar = async () => {
  await garantirListeners();
  await criarCanal();
  await PushNotifications.register();
};

export const registrarSeJaPermitidoNativo = async (): Promise<void> => {
  if (!ehNativo()) {
    return;
  }
  const atual = await PushNotifications.checkPermissions();
  if (atual.receive !== "granted") {
    return;
  }
  await registrar();
};

export const pedirPermissaoERegistrarNativo =
  async (): Promise<ResultadoPermissao> => {
    if (!ehNativo()) {
      return "unsupported";
    }
    if (recusouNestaSessao) {
      return "denied";
    }

    let atual = await PushNotifications.checkPermissions();
    if (atual.receive === "denied") {
      recusouNestaSessao = true;
      return "denied";
    }
    if (atual.receive !== "granted") {
      atual = await PushNotifications.requestPermissions();
    }
    if (atual.receive === "denied") {
      recusouNestaSessao = true;
      return "denied";
    }
    if (atual.receive !== "granted") {
      return "default";
    }

    await registrar();
    return "granted";
  };

export const ouvirForegroundNativo = (
  onPayload: (payload: PayloadForeground) => void,
): (() => void) => {
  onForeground = onPayload;
  return () => {
    if (onForeground === onPayload) {
      onForeground = null;
    }
  };
};

export const limparPushNativoNoLogout = async (): Promise<void> => {
  try {
    await PushNotifications.removeAllDeliveredNotifications();
  } catch {
    // best-effort — não bloqueia o logout
  }
  await limparTokenNativoLocal();
};
