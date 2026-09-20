"use client";

import { useCallback, useState } from "react";
import { compartilharConteudo } from "@/lib/compartilhar";
import { ERRO_SHARE, TOAST_LINK_COPIADO, textoShareLocal } from "../constants";

const TOAST_MS = 2500;

export const useCompartilharLocal = (nome: string, id: string) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const compartilhar = useCallback(async () => {
    const url = `${window.location.origin}/locais/${id}`;
    const resultado = await compartilharConteudo({
      title: nome,
      text: textoShareLocal(nome),
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
  }, [id, nome]);

  return { compartilhar, feedback };
};
