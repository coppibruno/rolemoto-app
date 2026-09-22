/**
 * Configuração e inicialização do Firebase.
 *
 * Este módulo é o ponto central de conexão com o Firebase.
 * Ele garante que apenas **uma instância** do app seja criada (singleton),
 * evitando erros de inicialização duplicada no Next.js (hot-reload / SSR).
 *
 * Variáveis de ambiente necessárias (prefixo NEXT_PUBLIC_ para uso no client):
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 * - NEXT_PUBLIC_FIREBASE_VAPID_KEY (Web Push; getToken no client)
 * - NEXT_PUBLIC_FUNCTIONS_URL (opcional; default aponta ao emulator em dev)
 * - NEXT_PUBLIC_STORAGE_EMULATOR_HOST (opcional; ex. 127.0.0.1:9199)
 *
 * @see .env.example para referência das variáveis
 */
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  type Auth,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { Capacitor } from "@capacitor/core";
import { conectarStorageEmulator } from "./storage-emulator";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Singleton — reutiliza a instância existente ou cria uma nova */
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Auth com IndexedDB no Capacitor (requisito do plugin + JS SDK).
 * No web usa getAuth; em HMR/SSR reutiliza a instância se já existir.
 */
const criarAuth = (): Auth => {
  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    try {
      return initializeAuth(app, {
        persistence: indexedDBLocalPersistence,
      });
    } catch {
      return getAuth(app);
    }
  }
  return getAuth(app);
};

/** Instância do Firebase Auth (login social, gerenciamento de sessão) */
export const auth = criarAuth();


/** Instância do Firebase Storage (upload de fotos de perfil e rolês) */
export const storage = getStorage(app);

const storageEmulatorHost = process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST;
if (storageEmulatorHost) {
  conectarStorageEmulator(storage, storageEmulatorHost);
}

const projectId = firebaseConfig.projectId ?? "";
const functionsRegion = "us-central1";

/**
 * URL base da function HTTP `api`.
 * Local (emulator): http://127.0.0.1:5001/<project>/us-central1/api
 * Produção: https://us-central1-<project>.cloudfunctions.net/api
 *
 * Sobrescreva com NEXT_PUBLIC_FUNCTIONS_URL se necessário.
 */
export const functionsApiUrl =
  process.env.NEXT_PUBLIC_FUNCTIONS_URL ??
  (process.env.NODE_ENV === "development"
    ? `http://127.0.0.1:5001/${projectId}/${functionsRegion}/api`
    : `https://${functionsRegion}-${projectId}.cloudfunctions.net/api`);

export default app;
