"use client";

import { useCallback, useEffect, useState } from "react";
import { CHAVE_FEEDBACK_ENTRADA_CHECADA } from "@/app/(app)/constants/feedback-sessao";
import { feedbackPendenteService } from "@/app/(app)/services/feedback-pendente.service";
import type { FeedbackPendente } from "@/types/usuario-role-feedback";

type RolePendente = NonNullable<FeedbackPendente["role"]>;

const dispensadoNaSessao = (): boolean => {
  try {
    return sessionStorage.getItem(CHAVE_FEEDBACK_ENTRADA_CHECADA) === "1";
  } catch {
    return false;
  }
};

export const useFeedbackPendente = () => {
  const [role, setRole] = useState<RolePendente | null>(null);

  useEffect(() => {
    if (dispensadoNaSessao()) return;

    let cancelado = false;
    feedbackPendenteService
      .buscar()
      .then((resposta) => {
        if (!cancelado) setRole(resposta.role);
      })
      .catch(() => {
        if (!cancelado) setRole(null);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const dispensar = useCallback(() => {
    try {
      sessionStorage.setItem(CHAVE_FEEDBACK_ENTRADA_CHECADA, "1");
    } catch {
      /* sessionStorage indisponível */
    }
    setRole(null);
  }, []);

  return { role, dispensar };
};
