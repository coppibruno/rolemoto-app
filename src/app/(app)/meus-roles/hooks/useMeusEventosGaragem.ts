"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { guardarCache, useHidratarCache } from "@/hooks/useCacheRetorno";
import type { MeuEventoGaragemItem } from "@/types/meus-roles";
import { ERRO_MEUS_EVENTOS } from "../constants";
import { meusRolesService } from "../services/meus-roles.service";

const CHAVE = "garagem:eventos";

export const useMeusEventosGaragem = (ativo: boolean) => {
  const [itens, setItens] = useState<MeuEventoGaragemItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);
  const jaCarregou = useRef(false);

  const recarregar = useCallback(() => {
    jaCarregou.current = false;
    setTicket((n) => n + 1);
  }, []);

  useHidratarCache<MeuEventoGaragemItem[]>(
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

    meusRolesService
      .listarEventos()
      .then((resposta) => {
        if (cancelado) return;
        setItens(resposta.itens);
        jaCarregou.current = true;
        guardarCache(CHAVE, resposta.itens);
      })
      .catch(() => {
        if (cancelado) return;
        setItens([]);
        setErro(ERRO_MEUS_EVENTOS);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [ativo, ticket]);

  return { itens, carregando, erro, recarregar };
};
