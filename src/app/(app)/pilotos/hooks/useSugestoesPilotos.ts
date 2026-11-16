"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { seguirService } from "@/app/(app)/seguir/services/seguir.service";
import type { LinhaSugestao } from "@/types/seguir";
import {
  chaveCacheSugestao,
  guardarCacheSugestao,
  lerCacheSugestao,
  tirarUidDoCache,
} from "../cache-sugestoes";
import type { PontoSugestao } from "./usePontoSugestao";

export type FaseSugestao = "carregando" | "ok" | "vazio" | "erro";

export const useSugestoesPilotos = (ponto: PontoSugestao | null, pronto: boolean) => {
  const [itens, setItens] = useState<LinhaSugestao[]>([]);
  const [fase, setFase] = useState<FaseSugestao>("carregando");
  const [toast, setToast] = useState<string | null>(null);
  const pedido = useRef(0);
  const itensRef = useRef(itens);
  itensRef.current = itens;
  const lat = ponto?.lat ?? null;
  const lng = ponto?.lng ?? null;
  const chaveRef = useRef("sem");
  chaveRef.current = chaveCacheSugestao(lat, lng);

  const carregar = useCallback(async () => {
    if (!pronto) return;
    const chave = chaveCacheSugestao(lat, lng);
    const emCache = lerCacheSugestao(chave);
    if (emCache) {
      setItens(emCache);
      setFase(emCache.length === 0 ? "vazio" : "ok");
      return;
    }
    const id = pedido.current + 1;
    pedido.current = id;
    setFase("carregando");
    try {
      const resposta = await seguirService.sugestoes(
        lat === null || lng === null ? undefined : lat,
        lat === null || lng === null ? undefined : lng,
      );
      if (id !== pedido.current) return;
      guardarCacheSugestao(chave, resposta.itens);
      setItens(resposta.itens);
      setFase(resposta.itens.length === 0 ? "vazio" : "ok");
    } catch {
      if (id !== pedido.current) return;
      setItens([]);
      setFase("erro");
    }
  }, [lat, lng, pronto]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const remover = (uid: string) => {
    tirarUidDoCache(uid);
    setItens((atual) => atual.filter((item) => item.uid !== uid));
  };

  const dispensar = async (uid: string) => {
    const anteriores = itensRef.current;
    if (!anteriores.some((item) => item.uid === uid)) return;
    remover(uid);
    try {
      await seguirService.dispensar(uid);
    } catch {
      guardarCacheSugestao(chaveRef.current, anteriores);
      setItens(anteriores);
      setToast("Não deu para ocultar");
    }
  };

  const faseExibida: FaseSugestao = fase === "ok" && itens.length === 0 ? "vazio" : fase;

  return {
    itens,
    fase: faseExibida,
    toast,
    recarregar: carregar,
    remover,
    dispensar,
  };
};
