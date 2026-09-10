import { connectStorageEmulator, type FirebaseStorage } from "firebase/storage";

type AlvoEmulator = {
  host: string;
  port: number;
  https: boolean;
};

const eLoopback = (host: string) =>
  host === "localhost" || host === "127.0.0.1";

/**
 * Aceita `127.0.0.1:9199` ou URL (`https://xxx.ngrok-free.app`).
 * `host:porta` com `split(":")` quebra em URL https (vira NaN e o SDK vai
 * para o bucket de produção — CORS no ngrok).
 */
export const parseStorageEmulatorHost = (
  valor: string,
): AlvoEmulator | null => {
  try {
    const url = valor.includes("://")
      ? new URL(valor)
      : new URL(`http://${valor}`);
    if (!url.hostname) return null;

    const https = url.protocol === "https:";
    const port = url.port ? Number(url.port) : https ? 443 : 9199;
    if (!Number.isFinite(port)) return null;

    return { host: url.hostname, port, https };
  } catch {
    return null;
  }
};

const alvoNoBrowser = (env: AlvoEmulator): AlvoEmulator => {
  if (typeof window === "undefined") return env;
  if (eLoopback(window.location.hostname) || !eLoopback(env.host)) {
    return env;
  }

  const https = window.location.protocol === "https:";
  const port = window.location.port
    ? Number(window.location.port)
    : https
      ? 443
      : 80;

  return { host: window.location.hostname, port, https };
};

export const conectarStorageEmulator = (
  storage: FirebaseStorage,
  valor: string,
) => {
  const parsed = parseStorageEmulatorHost(valor);
  if (!parsed) return;

  const alvo = alvoNoBrowser(parsed);
  connectStorageEmulator(storage, alvo.host, alvo.port);

  if (alvo.https) {
    (storage as FirebaseStorage & { _protocol: string })._protocol = "https";
  }
};
