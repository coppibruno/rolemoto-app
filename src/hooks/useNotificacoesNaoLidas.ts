"use client";

import { useCallback, useEffect, useState } from "react";
import { notificacoesService } from "@/app/(app)/notificacoes/services/notificacoes.service";
import { ouvirPushRecebido } from "@/lib/eventos-mensagens";
import { ouvirNotificacoesMudaram } from "@/lib/eventos-notificacoes";

const INTERVALO_MS = 60_000;

/** Não lidas da inbox. Poll + push + foco + evento local após marcar. */
export const useNotificacoesNaoLidas = (habilitado: boolean) => {
  const [total, setTotal] = useState(0);

  const buscar = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const resposta = await notificacoesService.naoLidas();
      setTotal(resposta.total);
    } catch {
      // Contador é acessório: mantém o último valor.
    }
  }, []);

  useEffect(() => {
    if (!habilitado) return;
    void buscar();
    const aoVoltar = () => void buscar();
    const intervalo = window.setInterval(aoVoltar, INTERVALO_MS);
    document.addEventListener("visibilitychange", aoVoltar);
    const pararPush = ouvirPushRecebido(aoVoltar);
    const pararLidas = ouvirNotificacoesMudaram(aoVoltar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
      pararPush();
      pararLidas();
    };
  }, [habilitado, buscar]);

  return habilitado ? total : 0;
};
