"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { seguirService } from "@/app/(app)/seguir/services/seguir.service";
import { useAuth } from "@/hooks/useAuth";
import type { LinhaPiloto } from "@/types/seguir";
import { filtrarSeguidos, termoDaBusca } from "../filtro-seguidos";

export type FaseBusca =
  | "carregando"
  | "ok"
  | "vazio"
  | "erro"
  | "semSeguidos"
  | "maisUmaLetra";

type FaseSeguidos = "carregando" | "ok" | "erro";

export const useBuscaPilotos = () => {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? null;
  const [texto, setTexto] = useState("");
  const [seguidos, setSeguidos] = useState<LinhaPiloto[]>([]);
  const [faseSeguidos, setFaseSeguidos] = useState<FaseSeguidos>("carregando");
  const [itensBusca, setItensBusca] = useState<LinhaPiloto[]>([]);
  const [faseBusca, setFaseBusca] = useState<FaseBusca>("carregando");
  const pedido = useRef(0);

  const carregarSeguidos = useCallback(async () => {
    if (!uid) return;
    setFaseSeguidos("carregando");
    try {
      const pagina = await seguirService.listar(uid, "seguindo");
      setSeguidos(pagina.itens);
      setFaseSeguidos("ok");
    } catch {
      setFaseSeguidos("erro");
    }
  }, [uid]);

  useEffect(() => {
    void carregarSeguidos();
  }, [carregarSeguidos]);

  const buscar = useCallback(async (q: string) => {
    const id = pedido.current + 1;
    pedido.current = id;
    setFaseBusca("carregando");
    try {
      const resposta = await seguirService.busca(q);
      if (id !== pedido.current) return;
      setItensBusca(resposta.itens);
      setFaseBusca(resposta.itens.length === 0 ? "vazio" : "ok");
    } catch {
      if (id !== pedido.current) return;
      setItensBusca([]);
      setFaseBusca("erro");
    }
  }, []);

  const termo = termoDaBusca(texto);
  const local = termo.length < 2;

  useEffect(() => {
    if (local) {
      pedido.current += 1;
      return;
    }
    setFaseBusca("carregando");
    setItensBusca([]);
    const timer = window.setTimeout(() => {
      void buscar(termo);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [termo, local, buscar]);

  const filtrados = useMemo(() => filtrarSeguidos(seguidos, termo), [seguidos, termo]);

  const faseLocal = (): FaseBusca => {
    if (faseSeguidos !== "ok") return faseSeguidos;
    if (seguidos.length === 0) return termo ? "maisUmaLetra" : "semSeguidos";
    if (filtrados.length === 0) return "maisUmaLetra";
    return "ok";
  };

  const colocarNoTopo = (pessoa: LinhaPiloto) => {
    setSeguidos((atual) => [pessoa, ...atual.filter((item) => item.uid !== pessoa.uid)]);
    setFaseSeguidos("ok");
  };

  return {
    texto,
    setTexto,
    termo,
    seguidos: filtrados,
    faseSeguidos: faseLocal(),
    itensBusca,
    faseBusca,
    tentarSeguidos: () => {
      void carregarSeguidos();
    },
    tentarBusca: () => {
      void buscar(termo);
    },
    colocarNoTopo,
  };
};
