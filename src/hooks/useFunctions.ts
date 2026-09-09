/**
 * Hook para chamar a API HTTP das Cloud Functions a partir do frontend.
 *
 * Usa `fetch` com o ID token do Firebase Auth — o backend é Express
 * (`onRequest`), não callable (`onCall` / `httpsCallable`).
 *
 * @example
 * ```tsx
 * const { get, post, put, del, loading, erro } = useFunctions();
 *
 * const roles = await get<Role[]>("/roles");
 * const criado = await post<Role>("/roles", { destinoFinal: {...} });
 * await put(`/roles/${id}`, { categoria: "moderado" });
 * await del(`/roles/${id}`);
 * ```
 */
"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export const useFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const executar = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setErro(null);
    try {
      return await fn();
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao chamar a API";
      setErro(mensagem);
      console.error("Erro na API:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(
    <T = unknown>(caminho: string) => executar<T>(() => api<T>(caminho)),
    [executar]
  );

  const post = useCallback(
    <T = unknown>(caminho: string, body?: unknown) =>
      executar<T>(() =>
        api<T>(caminho, { method: "POST", body: JSON.stringify(body ?? {}) })
      ),
    [executar]
  );

  const put = useCallback(
    <T = unknown>(caminho: string, body?: unknown) =>
      executar<T>(() =>
        api<T>(caminho, { method: "PUT", body: JSON.stringify(body ?? {}) })
      ),
    [executar]
  );

  const del = useCallback(
    <T = unknown>(caminho: string) =>
      executar<T>(() => api<T>(caminho, { method: "DELETE" })),
    [executar]
  );

  return { get, post, put, del, loading, erro };
};
