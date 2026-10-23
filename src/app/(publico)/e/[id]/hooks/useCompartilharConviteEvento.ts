"use client";

import { useCallback, useState } from "react";
import {
  textoConviteEvento,
  urlConviteEvento,
  type DadosConviteEvento,
} from "@/lib/convite-evento";
import { COPY_LINK_COPIADO } from "../constants";

export const useCompartilharConviteEvento = (dados: DadosConviteEvento) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const compartilhar = useCallback(async () => {
    const url = urlConviteEvento(dados.id);
    const texto = textoConviteEvento(dados);

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: dados.titulo, text: texto, url });
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
      setFeedback(COPY_LINK_COPIADO);
      window.setTimeout(() => setFeedback(null), 2500);
    } catch {
      setFeedback("Não foi possível compartilhar");
      window.setTimeout(() => setFeedback(null), 2500);
    }
  }, [dados]);

  return { compartilhar, feedback };
};
