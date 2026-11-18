import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { Preferences } from "@capacitor/preferences";
import { PushNotifications } from "@capacitor/push-notifications";
import { dispositivosService } from "@/app/(app)/services/dispositivos.service";
import type { PlataformaDispositivo } from "@/types/dispositivo";
import { navegarNoWebView } from "./deep-link-nativo";
import { avisarPushRecebido } from "./eventos-mensagens";
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

const ehIos = () => Capacitor.getPlatform() === "ios";
const ehAndroid = () => Capacitor.getPlatform() === "android";

let recusouNestaSessao = false;
let tokenEmMemoria: string | null = null;
let listenersPromise: Promise<void> | null = null;
let onForeground: ((payload: PayloadForeground) => void) | null = null;

const guardarToken = async (token: string) => {
  tokenEmMemoria = token;
  await Preferences.set({ key: PREF_TOKEN, value: token });
};

const persistirToken = async (token: string) => {
  if (!token) {
    return;
  }
  try {
    await guardarToken(token);
    await dispositivosService.registrar(token, plataformaAtual());
  } catch {
    console.warn("FCM nativo: falha ao registrar token");
  }
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

const textoDoCampo = (valor: unknown): string =>
  typeof valor === "string" ? valor : "";

const tituloDoPayload = (
  notification?: { title?: string; body?: string },
  data?: Record<string, unknown>,
): PayloadForeground => ({
  title: notification?.title || textoDoCampo(data?.title),
  body: notification?.body || textoDoCampo(data?.body),
});

const criarCanalAndroid = async () => {
  if (!ehAndroid()) {
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

/** Android: @capacitor/push-notifications (token FCM). Não alterar este fluxo. */
const instalarListenersAndroid = async () => {
  await PushNotifications.addListener("registration", (evento) => {
    void persistirToken(evento.value);
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
      avisarPushRecebido();
      navegarNoWebView(data.url);
    },
  );
};

/**
 * iOS: @capacitor-firebase/messaging (token FCM).
 * @capacitor/push-notifications no iOS devolve APNs hex — incompatível com Admin FCM.
 */
const instalarListenersIos = async () => {
  await FirebaseMessaging.addListener("tokenReceived", (evento) => {
    void persistirToken(evento.token);
  });

  await FirebaseMessaging.addListener("notificationReceived", (evento) => {
    const notificacao = evento.notification;
    const data = (notificacao.data ?? {}) as Record<string, unknown>;
    const { title, body } = tituloDoPayload(
      { title: notificacao.title, body: notificacao.body },
      data,
    );
    if (!title || !onForeground) {
      return;
    }
    onForeground({ title, body });
  });

  await FirebaseMessaging.addListener(
    "notificationActionPerformed",
    (evento) => {
      const data = (evento.notification.data ?? {}) as Record<string, unknown>;
      avisarPushRecebido();
      navegarNoWebView(data.url);
    },
  );
};

const instalarListeners = async () => {
  if (ehIos()) {
    await instalarListenersIos();
    return;
  }
  await instalarListenersAndroid();
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

const registrarAndroid = async () => {
  await garantirListeners();
  await criarCanalAndroid();
  await PushNotifications.register();
};

const registrarIos = async () => {
  await garantirListeners();
  const { token } = await FirebaseMessaging.getToken();
  await persistirToken(token);
};

const registrar = async () => {
  if (ehIos()) {
    await registrarIos();
    return;
  }
  await registrarAndroid();
};

const checarPermissao = async () => {
  if (ehIos()) {
    return (await FirebaseMessaging.checkPermissions()).receive;
  }
  return (await PushNotifications.checkPermissions()).receive;
};

const pedirPermissao = async () => {
  if (ehIos()) {
    return (await FirebaseMessaging.requestPermissions()).receive;
  }
  return (await PushNotifications.requestPermissions()).receive;
};

export const registrarSeJaPermitidoNativo = async (): Promise<void> => {
  if (!ehNativo()) {
    return;
  }
  const atual = await checarPermissao();
  if (atual !== "granted") {
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

    let atual = await checarPermissao();
    if (atual === "denied") {
      recusouNestaSessao = true;
      return "denied";
    }
    if (atual !== "granted") {
      atual = await pedirPermissao();
    }
    if (atual === "denied") {
      recusouNestaSessao = true;
      return "denied";
    }
    if (atual !== "granted") {
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
    if (ehIos()) {
      await FirebaseMessaging.removeAllDeliveredNotifications();
      await FirebaseMessaging.deleteToken();
    } else {
      await PushNotifications.removeAllDeliveredNotifications();
    }
  } catch {
    // best-effort — não bloqueia o logout
  }
  await limparTokenNativoLocal();
};
