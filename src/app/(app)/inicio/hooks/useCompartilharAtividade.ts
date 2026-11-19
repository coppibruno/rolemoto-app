"use client";

import { useCallback, useState } from "react";
import { compartilharConteudo } from "@/lib/compartilhar";
import type { ItemAtividade } from "@/types/atividade";
import { payloadCompartilharAtividade } from "../compartilhar-atividade";

const TOAST_MS = 2500;

export const useCompartilharAtividade = (item: ItemAtividade) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const payload = payloadCompartilharAtividade(item);

  const compartilhar = useCallback(async () => {
    if (!payload) return;
    const resultado = await compartilharConteudo(payload);
    if (resultado === "copiado") {
      setFeedback("Link copiado");
      window.setTimeout(() => setFeedback(null), TOAST_MS);
      return;
    }
    if (resultado === "erro") {
      setFeedback("Não foi possível compartilhar");
      window.setTimeout(() => setFeedback(null), TOAST_MS);
    }
  }, [payload]);

  return { podeCompartilhar: Boolean(payload), compartilhar, feedback };
};
