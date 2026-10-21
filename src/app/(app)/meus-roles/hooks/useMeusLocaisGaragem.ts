"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MeuLocalGaragemItem,
  RecorteLocaisGaragem,
} from "@/types/meus-roles";
import { ERRO_MEUS_LOCAIS } from "../constants";
import { meusRolesService } from "../services/meus-roles.service";

export const useMeusLocaisGaragem = (
  ativo: boolean,
  recorte: RecorteLocaisGaragem,
) => {
  const [itens, setItens] = useState<MeuLocalGaragemItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);
  const recorteCarregado = useRef<RecorteLocaisGaragem | null>(null);

  const recarregar = useCallback(() => {
    recorteCarregado.current = null;
    setTicket((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!ativo) return;
    if (recorteCarregado.current === recorte && ticket === 0) return;

    let cancelado = false;
    setCarregando(true);
    setErro(null);

    meusRolesService
      .listarLocais(recorte)
      .then((resposta) => {
        if (cancelado) return;
        setItens(resposta.itens);
        recorteCarregado.current = recorte;
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
  }, [ativo, recorte, ticket]);

  return { itens, carregando, erro, recarregar };
};
