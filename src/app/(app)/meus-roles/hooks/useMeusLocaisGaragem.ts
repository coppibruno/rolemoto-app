"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MeuLocalGaragemItem } from "@/types/meus-roles";
import { ERRO_MEUS_LOCAIS } from "../constants";
import { meusRolesService } from "../services/meus-roles.service";

export const useMeusLocaisGaragem = (ativo: boolean) => {
  const [itens, setItens] = useState<MeuLocalGaragemItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);
  const jaCarregou = useRef(false);

  const recarregar = useCallback(() => {
    jaCarregou.current = false;
    setTicket((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!ativo) return;
    if (jaCarregou.current && ticket === 0) return;

    let cancelado = false;
    setCarregando(true);
    setErro(null);

    meusRolesService
      .listarLocais()
      .then((resposta) => {
        if (cancelado) return;
        setItens(resposta.itens);
        jaCarregou.current = true;
      })
      .catch(() => {
        if (cancelado) return;
        setItens([]);
        setErro(ERRO_MEUS_LOCAIS);
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
