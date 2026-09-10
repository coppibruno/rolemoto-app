"use client";

import { useCallback, useEffect, useState } from "react";
import type { RoleFeedItem } from "@/types/role";
import { filtrosParaParams, rolesService } from "../services/roles.service";
import type { FiltrosFeed } from "../types";

export const useListaRoles = (filtros: FiltrosFeed) => {
  const [itens, setItens] = useState<RoleFeedItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  const quandoKey =
    filtros.quando && typeof filtros.quando === "object"
      ? `data:${filtros.quando.iso}`
      : String(filtros.quando ?? "");

  useEffect(() => {
    const params = filtrosParaParams(filtros);
    if (!params) {
      setItens([]);
      setCarregando(false);
      setErro(null);
      return;
    }

    let cancelado = false;
    setCarregando(true);
    setErro(null);

    rolesService
      .listar(params)
      .then((dados) => {
        if (!cancelado) setItens(dados);
      })
      .catch(() => {
        if (!cancelado) {
          setItens([]);
          setErro("Não foi possível carregar os rolês");
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [
    filtros.ponto?.lat,
    filtros.ponto?.lng,
    filtros.raioKm,
    quandoKey,
    filtros.ritmo,
    filtros.busca,
    ticket,
  ]);

  return { itens, carregando, erro, recarregar };
};
