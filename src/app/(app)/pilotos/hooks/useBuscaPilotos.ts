"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { seguirService } from "@/app/(app)/seguir/services/seguir.service";
import type { LinhaPiloto } from "@/types/seguir";

export type FaseBusca = "curto" | "carregando" | "ok" | "vazio" | "erro";

const termoDaBusca = (valor: string) => valor.trim().replace(/\s+/g, " ");

export const useBuscaPilotos = () => {
  const [texto, setTexto] = useState("");
  const [itens, setItens] = useState<LinhaPiloto[]>([]);
  const [fase, setFase] = useState<FaseBusca>("curto");
  const pedido = useRef(0);

  const buscar = useCallback(async (q: string) => {
    const id = pedido.current + 1;
    pedido.current = id;
    setFase("carregando");
    try {
      const resposta = await seguirService.busca(q);
      if (id !== pedido.current) return;
      setItens(resposta.itens);
      setFase(resposta.itens.length === 0 ? "vazio" : "ok");
    } catch {
      if (id !== pedido.current) return;
      setItens([]);
      setFase("erro");
    }
  }, []);

  useEffect(() => {
    const q = termoDaBusca(texto);
    if (q.length < 2) {
      pedido.current += 1;
      setItens([]);
      setFase("curto");
      return;
    }

    setFase("carregando");
    setItens([]);
    const timer = window.setTimeout(() => {
      void buscar(q);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [texto, buscar]);

  const tentarDeNovo = () => {
    const q = termoDaBusca(texto);
    if (q.length < 2) return;
    void buscar(q);
  };

  return { texto, setTexto, itens, fase, tentarDeNovo };
};
