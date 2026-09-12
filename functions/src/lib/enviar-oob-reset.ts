import {origemApp} from "./origem";

const origemIdentityToolkit = (): string => {
  const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST?.trim();
  if (emulator) {
    const host = emulator.replace(/^https?:\/\//, "");
    return `http://${host}/identitytoolkit.googleapis.com`;
  }
  return "https://identitytoolkit.googleapis.com";
};

/**
 * Dispara o e-mail nativo de PASSWORD_RESET do Firebase Auth (REST).
 * Não usa `generatePasswordResetLink` — esse só devolve URL e geraria outro oobCode.
 */
export const enviarOobReset = async (email: string): Promise<void> => {
  const key = process.env.FIREBASE_WEB_API_KEY?.trim();
  if (!key) {
    throw new Error("FIREBASE_WEB_API_KEY ausente");
  }

  const origem = origemApp();
  const corpo: Record<string, unknown> = {
    requestType: "PASSWORD_RESET",
    email,
    canHandleCodeInApp: true,
  };
  if (origem) {
    corpo.continueUrl = `${origem}/redefinir-senha`;
  }

  const url =
    `${origemIdentityToolkit()}/v1/accounts:sendOobCode` +
    `?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(corpo),
  });

  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    throw new Error(`sendOobCode falhou (${res.status}): ${detalhe}`);
  }
};
