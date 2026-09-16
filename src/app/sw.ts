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

const urlDoPayload = (data: unknown): string | null => {
  if (!data || typeof data !== "object") {
    return null;
  }
  const rec = data as Record<string, unknown>;
  if (typeof rec.url === "string" && rec.url) {
    return rec.url;
  }
  const fcm = rec.FCM_MSG;
  if (fcm && typeof fcm === "object") {
    const inner = fcm as { data?: { url?: unknown } };
    if (typeof inner.data?.url === "string") {
      return inner.data.url;
    }
  }
  return null;
};

const abrirUrl = async (caminho: string) => {
  const url = new URL(caminho, self.location.origin).href;
  const clientes = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
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
  onBackgroundMessage(messaging, (payload) => {
    const data = payload.data ?? {};
    const title = data.title || payload.notification?.title || "";
    if (!title) {
      return;
    }
    const icon =
      data.icon || `${self.location.origin}/icons/icon-192.png`;
    return self.registration.showNotification(title, {
      body: data.body || payload.notification?.body || "",
      data,
      icon,
      tag: data.roleId ? `${data.tipo ?? "push"}-${data.roleId}` : undefined,
    });
  });
}

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
