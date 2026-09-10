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

const obterRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  const existente = await navigator.serviceWorker.getRegistration();
  if (!existente) {
    return null;
  }
  return navigator.serviceWorker.ready;
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

export const ouvirForeground = async (
  onPayload: (payload: PayloadForeground) => void,
): Promise<() => void> => {
  const messaging = await obterMessaging();
  if (!messaging) {
    return () => undefined;
  }

  const { onMessage } = await import("firebase/messaging");
  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "";
    if (!title) {
      return;
    }
    onPayload({
      title,
      body: payload.notification?.body ?? "",
    });
  });
};
