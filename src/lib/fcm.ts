import app from "./firebase";

export type ResultadoPermissao =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export type PayloadForeground = {
  title: string;
  body: string;
};

const ESPERA_SW_MS = 800;

const obterRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  const existente = await navigator.serviceWorker.getRegistration();
  if (existente) {
    return navigator.serviceWorker.ready;
  }
  await new Promise((resolve) => window.setTimeout(resolve, ESPERA_SW_MS));
  const segunda = await navigator.serviceWorker.getRegistration();
  if (!segunda) {
    return null;
  }
  return navigator.serviceWorker.ready;
};

const tituloDoPayload = (payload: {
  data?: Record<string, string>;
  notification?: { title?: string; body?: string };
}): { title: string; body: string } => {
  const title = payload.data?.title || payload.notification?.title || "";
  const body = payload.data?.body || payload.notification?.body || "";
  return { title, body };
};

export const messagingSuportado = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  const { isSupported } = await import("firebase/messaging");
  return isSupported();
};

const obterMessaging = async () => {
  if (!(await messagingSuportado())) {
    return null;
  }
  const { getMessaging } = await import("firebase/messaging");
  return getMessaging(app);
};

export const obterToken = async (): Promise<string | null> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }
  if (Notification.permission !== "granted") {
    return null;
  }
  if (!(await messagingSuportado())) {
    return null;
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    return null;
  }

  const registration = await obterRegistration();
  if (!registration) {
    return null;
  }

  const messaging = await obterMessaging();
  if (!messaging) {
    return null;
  }

  const { getToken } = await import("firebase/messaging");
  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch {
    return null;
  }
};

const mostrarNativa = async (
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> => {
  const registration = await obterRegistration();
  if (!registration) {
    return;
  }
  const icon = data?.icon || "/icons/icon-192.png";
  await registration.showNotification(title, {
    body,
    data,
    icon,
    tag: data?.roleId ? `${data.tipo ?? "push"}-${data.roleId}` : undefined,
  });
};

export const ouvirForeground = async (
  onPayload: (payload: PayloadForeground) => void,
): Promise<() => void> => {
  const messaging = await obterMessaging();
  if (!messaging) {
    return () => undefined;
  }

  const { onMessage } = await import("firebase/messaging");
  return onMessage(messaging, (payload) => {
    const { title, body } = tituloDoPayload(payload);
    if (!title) {
      return;
    }
    const naTela =
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      document.hasFocus();
    if (!naTela) {
      void mostrarNativa(title, body, payload.data);
      return;
    }
    onPayload({ title, body });
  });
};
