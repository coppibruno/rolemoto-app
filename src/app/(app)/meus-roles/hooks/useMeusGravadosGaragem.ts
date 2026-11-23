"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { guardarCache, useHidratarCache } from "@/hooks/useCacheRetorno";
import type { RoleTelemetria } from "@/types/role-telemetria";
import { telemetriaService } from "@/app/(app)/telemetria/services/telemetria.service";
import { ERRO_MEUS_GRAVADOS } from "../constants";

const CHAVE = "garagem:gravados";

export const useMeusGravadosGaragem = (ativo: boolean) => {
  const [itens, setItens] = useState<RoleTelemetria[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);
  const jaCarregou = useRef(false);

  const recarregar = useCallback(() => {
    jaCarregou.current = false;
    setTicket((n) => n + 1);
  }, []);

  const removerLocal = useCallback((id: string) => {
    setItens((atual) => {
      const proxima = atual.filter((item) => item.id !== id);
      guardarCache(CHAVE, proxima);
      return proxima;
    });
  }, []);

  useHidratarCache<RoleTelemetria[]>(
    ativo ? CHAVE : null,
    (valor) => {
      setItens(valor);
      setCarregando(false);
    },
    () => setItens((atual) => (atual.length === 0 ? atual : [])),
  );

  useEffect(() => {
    if (!ativo) return;
    if (jaCarregou.current && ticket === 0) return;

    let cancelado = false;
    setCarregando(true);
    setErro(null);

    telemetriaService
      .listarMinhas()
      .then((resposta) => {
        if (cancelado) return;
        setItens(resposta);
        jaCarregou.current = true;
        guardarCache(CHAVE, resposta);
      })
      .catch(() => {
        if (cancelado) return;
        setItens([]);
        setErro(ERRO_MEUS_GRAVADOS);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [ativo, ticket]);

  return { itens, carregando, erro, recarregar, removerLocal };
};
