"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { RankingConquista } from "@/types/conquista";
import { rankingService } from "../services/ranking.service";

export const usePlacarRanking = (conquistaId: string) => {
  const [placar, setPlacar] = useState<RankingConquista | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const pedido = useRef(0);

  const carregar = useCallback(async () => {
    const id = pedido.current + 1;
    pedido.current = id;
    setCarregando(true);
    setErro(null);
    setNaoEncontrado(false);
    try {
      const resposta = await rankingService.placar(conquistaId);
      if (id === pedido.current) setPlacar(resposta);
    } catch (erroApi) {
      if (id !== pedido.current) return;
      setPlacar(null);
      if (erroApi instanceof ApiError && erroApi.status === 404) {
        setNaoEncontrado(true);
        return;
      }
      setErro("Não deu para carregar o ranking.");
    } finally {
      if (id === pedido.current) setCarregando(false);
    }
  }, [conquistaId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return { placar, carregando, erro, naoEncontrado, recarregar: carregar };
};
