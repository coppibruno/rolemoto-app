"use client";

import { useCallback, useState } from "react";
import { compartilharConteudo } from "@/lib/compartilhar";
import { ERRO_SHARE, TOAST_LINK_COPIADO, textoShareEvento } from "../constants";

const TOAST_MS = 2500;

export const useCompartilharEvento = (titulo: string, id: string) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const compartilhar = useCallback(async () => {
    const url = `${window.location.origin}/eventos/${id}`;
    const resultado = await compartilharConteudo({
      title: titulo,
      text: textoShareEvento(titulo),
      url,
    });
    if (resultado === "copiado") {
      setFeedback(TOAST_LINK_COPIADO);
      window.setTimeout(() => setFeedback(null), TOAST_MS);
      return;
    }
    if (resultado === "erro") {
      setFeedback(ERRO_SHARE);
      window.setTimeout(() => setFeedback(null), TOAST_MS);
    }
  }, [id, titulo]);

  return { compartilhar, feedback };
};
