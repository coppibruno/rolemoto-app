import { ApiError } from "@/lib/api";

export const isFalhaDeRede = (erro: unknown): boolean => {
  if (erro instanceof TypeError) return true;
  if (erro instanceof ApiError && erro.status === 0) return true;
  const msg = erro instanceof Error ? erro.message.toLowerCase() : "";
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed")
  );
};

export const isErroAuth = (erro: unknown): boolean =>
  erro instanceof ApiError && (erro.status === 401 || erro.status === 403);
