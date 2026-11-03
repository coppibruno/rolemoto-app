"use client";

import { useCallback, useEffect, useState } from "react";
import { guardarCache, useHidratarCache } from "@/hooks/useCacheRetorno";
import type { MeusRolesPayload } from "@/types/meus-roles";
import { ERRO_MEUS_ROLES } from "../constants";
import { meusRolesService } from "../services/meus-roles.service";

const CHAVE = "garagem:roles";

export const useMeusRoles = () => {
  const [payload, setPayload] = useState<MeusRolesPayload | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useHidratarCache<MeusRolesPayload>(
    CHAVE,
    (valor) => {
      setPayload(valor);
      setCarregando(false);
    },
    () => setPayload(null),
  );

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    meusRolesService
      .listar()
      .then((resposta) => {
        if (cancelado) return;
        setPayload(resposta);
        guardarCache(CHAVE, resposta);
      })
      .catch(() => {
        if (cancelado) return;
        setPayload(null);
        setErro(ERRO_MEUS_ROLES);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [ticket]);

  return { payload, carregando, erro, recarregar };
};
