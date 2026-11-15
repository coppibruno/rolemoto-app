"use client";

import { useCallback, useEffect, useState } from "react";
import { mensagensService } from "@/app/(app)/mensagens/services/mensagens.service";
import { ouvirNaoLidasMudaram, ouvirPushRecebido } from "@/lib/eventos-mensagens";

const INTERVALO_MS = 60_000;

/** Conversas com mensagem não lida. Sem leitura ao vivo: busca ao abrir, no push, ao voltar ao app e a cada minuto. */
export const useMensagensNaoLidas = (habilitado: boolean) => {
  const [total, setTotal] = useState(0);

  const buscar = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const resposta = await mensagensService.naoLidas();
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
    const pararLidas = ouvirNaoLidasMudaram(aoVoltar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
      pararPush();
      pararLidas();
    };
  }, [habilitado, buscar]);

  return habilitado ? total : 0;
};
