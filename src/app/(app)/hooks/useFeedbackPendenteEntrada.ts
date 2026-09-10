"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CHAVE_FEEDBACK_ENTRADA_CHECADA } from "@/app/(app)/constants/feedback-sessao";
import { feedbackPendenteService } from "@/app/(app)/services/feedback-pendente.service";

const ROTA_FEEDBACK = /^\/roles\/[^/]+\/feedback$/;

const marcarChecada = () => {
  try {
    sessionStorage.setItem(CHAVE_FEEDBACK_ENTRADA_CHECADA, "1");
  } catch {
    /* sessionStorage indisponível */
  }
};

const jaChecada = (): boolean => {
  try {
    return sessionStorage.getItem(CHAVE_FEEDBACK_ENTRADA_CHECADA) === "1";
  } catch {
    return true;
  }
};

export const useFeedbackPendenteEntrada = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    if (ROTA_FEEDBACK.test(pathname ?? "")) {
      marcarChecada();
      setLiberado(true);
      return;
    }

    if (jaChecada()) {
      setLiberado(true);
      return;
    }

    let cancelado = false;
    const checar = async () => {
      try {
        const { role } = await feedbackPendenteService.buscar();
        if (cancelado) return;
        if (!role) {
          marcarChecada();
          setLiberado(true);
          return;
        }
        router.replace(`/roles/${role.id}/feedback`);
      } catch {
        if (cancelado) return;
        marcarChecada();
        setLiberado(true);
      }
    };

    void checar();
    return () => {
      cancelado = true;
    };
  }, [pathname, router]);

  return { liberado };
};
