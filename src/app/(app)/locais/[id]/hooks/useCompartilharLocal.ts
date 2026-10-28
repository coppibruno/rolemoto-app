"use client";

import { useCallback, useState } from "react";
import {
  textoConviteLocal,
  urlConviteLocal,
  type DadosConviteLocal,
} from "@/lib/convite-local";
import { ERRO_SHARE, TOAST_LINK_COPIADO } from "../constants";

const TOAST_MS = 2500;

export const useCompartilharLocal = (dados: DadosConviteLocal) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const compartilhar = useCallback(async () => {
    const url = urlConviteLocal(dados.id);
    const texto = textoConviteLocal(dados);

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: dados.nome, text: texto, url });
        return;
      }
    } catch (erro) {
      if (erro instanceof Error && erro.name === "AbortError") return;
    }

    const wa = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    const janela = window.open(wa, "_blank", "noopener,noreferrer");
    if (janela) return;

    try {
      await navigator.clipboard.writeText(url);
      setFeedback(TOAST_LINK_COPIADO);
      window.setTimeout(() => setFeedback(null), TOAST_MS);
    } catch {
      setFeedback(ERRO_SHARE);
      window.setTimeout(() => setFeedback(null), TOAST_MS);
    }
  }, [dados]);

  return { compartilhar, feedback };
};
