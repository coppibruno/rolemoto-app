"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContagensFeed } from "@/types/feed";
import { filtrosParaContagens, feedService } from "../services/feed.service";
import type { FiltrosFeed } from "../types";

const CONTAGENS_VAZIAS: ContagensFeed = { roles: 0, eventos: 0, locais: 0 };

export const useContagensFeed = (filtros: FiltrosFeed) => {
  const [contagens, setContagens] = useState<ContagensFeed | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  const quandoKey =
    filtros.quando && typeof filtros.quando === "object"
      ? `data:${filtros.quando.iso}`
      : String(filtros.quando ?? "");

  useEffect(() => {
    const params = filtrosParaContagens(filtros);
    if (!params) {
      setContagens(CONTAGENS_VAZIAS);
      setCarregando(false);
      return;
    }

    let cancelado = false;
    setCarregando(true);

    feedService
      .contagens(params)
      .then((dados) => {
        if (!cancelado) setContagens(dados);
      })
      .catch(() => {
        /* mantém último N conhecido */
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

  return { contagens, carregando, recarregar };
};
