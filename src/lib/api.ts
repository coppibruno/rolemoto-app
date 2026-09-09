/**
 * Cliente HTTP da Cloud Function `api`.
 *
 * Envia o ID token do Firebase Auth em `Authorization: Bearer`.
 * Não usa `httpsCallable` — o backend é Express via `onRequest`.
 */
import { auth, functionsApiUrl } from "./firebase";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const montarHeaders = async (headersInit?: HeadersInit): Promise<Headers> => {
  const headers = new Headers(headersInit);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = await auth.currentUser?.getIdToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
};

export const api = async <T = unknown>(
  caminho: string,
  opcoes?: RequestInit
): Promise<T> => {
  const headers = await montarHeaders(opcoes?.headers);
  const res = await fetch(`${functionsApiUrl}${caminho}`, {
    ...opcoes,
    headers,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = (await res.json().catch(() => ({}))) as { erro?: string };

  if (!res.ok) {
    throw new ApiError(res.status, data.erro ?? "Erro na API");
  }

  return data as T;
};
