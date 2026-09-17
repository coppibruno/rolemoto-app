/// <reference lib="webworker" />

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import type {
  PrecacheEntry,
  RuntimeCaching,
  SerwistGlobalConfig,
} from "serwist";
import { NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const firebasePronto =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.messagingSenderId) &&
  Boolean(firebaseConfig.appId);

const firebaseApp = firebasePronto
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0]
  : null;

const messaging = firebaseApp ? getMessaging(firebaseApp) : null;

type PayloadPush = {
  data?: Record<string, string>;
  notification?: { title?: string; body?: string };
  FCM_MSG?: PayloadPush;
};

const clientesJanela = () =>
  self.clients.matchAll({ type: "window", includeUncontrolled: true });

const temClienteFocado = async (): Promise<boolean> => {
  const clientes = await clientesJanela();
  return clientes.some((client) => "focused" in client && client.focused);
};

const comoStrings = (valor: unknown): Record<string, string> => {
  if (!valor || typeof valor !== "object") {
    return {};
  }
  const saida: Record<string, string> = {};
  for (const [chave, item] of Object.entries(valor)) {
    if (typeof item === "string") {
      saida[chave] = item;
    }
  }
  return saida;
};

const partesDoPayload = (
  raw: unknown,
): {
  data: Record<string, string>;
  notification?: { title?: string; body?: string };
} => {
  if (!raw || typeof raw !== "object") {
    return { data: {} };
  }
  const rec = raw as PayloadPush;
  const inner =
    rec.FCM_MSG && typeof rec.FCM_MSG === "object" ? rec.FCM_MSG : rec;
  const data = {
    ...comoStrings(inner),
    ...comoStrings(inner.data),
  };
  return { data, notification: inner.notification };
};

const urlDoPayload = (data: unknown): string | null => {
  const { data: campos } = partesDoPayload(data);
  return campos.url || null;
};

const mostrarNotificacao = (
  data: Record<string, string>,
  notification?: { title?: string; body?: string },
): Promise<void> => {
  const title = data.title || notification?.title || "";
  if (!title) {
    return Promise.resolve();
  }
  const icon = data.icon || `${self.location.origin}/icons/icon-192.png`;
  return self.registration.showNotification(title, {
    body: data.body || notification?.body || "",
    data,
    icon,
    tag: data.roleId ? `${data.tipo ?? "push"}-${data.roleId}` : undefined,
  });
};

const abrirUrl = async (caminho: string) => {
  const url = new URL(caminho, self.location.origin).href;
  const clientes = await clientesJanela();
  for (const client of clientes) {
    if ("focus" in client) {
      await client.focus();
      if ("navigate" in client) {
        await client.navigate(url);
      }
      return;
    }
  }
  await self.clients.openWindow(url);
};

if (messaging) {
  onBackgroundMessage(messaging, async (payload) => {
    if (await temClienteFocado()) {
      return;
    }
    const { data, notification } = partesDoPayload(payload);
    await mostrarNotificacao(data, notification);
  });
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      if (await temClienteFocado()) {
        return;
      }
      let raw: unknown = null;
      try {
        raw = event.data?.json() ?? null;
      } catch {
        return;
      }
      const { data, notification } = partesDoPayload(raw);
      await mostrarNotificacao(data, notification);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const caminho = urlDoPayload(event.notification.data) ?? "/";
  event.waitUntil(abrirUrl(caminho));
});

const eRotaDeDados = (url: URL, sameOrigin: boolean) =>
  !sameOrigin ||
  url.pathname.startsWith("/v0/") ||
  url.pathname.startsWith("/api/");

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ request, url, sameOrigin }) =>
      request.destination === "document" && !eRotaDeDados(url, sameOrigin),
    handler: new NetworkFirst({
      cacheName: "rolemoto-pages",
      networkTimeoutSeconds: 3,
    }),
  },
  {
    matcher: ({ request, url, sameOrigin }) =>
      sameOrigin &&
      !eRotaDeDados(url, sameOrigin) &&
      ["style", "script", "worker", "font", "image"].includes(
        request.destination,
      ),
    handler: new StaleWhileRevalidate({
      cacheName: "rolemoto-assets",
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
