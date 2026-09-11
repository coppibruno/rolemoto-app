"use client";

import { useCallback, useState } from "react";
import {
  textoConvite,
  urlConvite,
  type DadosConvite,
} from "@/lib/convite";
import { COPY_LINK_COPIADO } from "../constants";

export const useCompartilharConvite = (dados: DadosConvite) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const { id, titulo, dataHoraSaida, localSaidaEndereco } = dados;

  const compartilhar = useCallback(async () => {
    const payload = { id, titulo, dataHoraSaida, localSaidaEndereco };
    const url = urlConvite(payload.id);
    const texto = textoConvite(payload);

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: payload.titulo, text: texto, url });
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
  }, [id, titulo, dataHoraSaida, localSaidaEndereco]);

  return { compartilhar, feedback };
};
