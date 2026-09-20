"use client";

import { useCallback, useState } from "react";

const TOAST_MS = 2500;

export const useCompartilharTelemetria = (titulo: string, id: string) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const compartilhar = useCallback(async () => {
    const url = `${window.location.origin}/telemetria/${id}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: titulo, text: titulo, url });
        return;
      }
    } catch (erro) {
      if (erro instanceof Error && erro.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Link copiado");
      window.setTimeout(() => setFeedback(null), TOAST_MS);
    } catch {
      setFeedback("Não foi possível compartilhar");
      window.setTimeout(() => setFeedback(null), TOAST_MS);
    }
  }, [id, titulo]);

  return { compartilhar, feedback };
};
