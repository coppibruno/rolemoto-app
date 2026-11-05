"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { seguirService } from "@/app/(app)/seguir/services/seguir.service";
import type { AbaSeguir, LinhaPiloto } from "@/types/seguir";

const juntar = (atual: LinhaPiloto[], novos: LinhaPiloto[]) => {
  const vistos = new Set(atual.map((item) => item.uid));
  const extras = novos.filter((item) => !vistos.has(item.uid));
  return [...atual, ...extras];
};

export const useListaSeguir = (uid: string, aba: AbaSeguir) => {
  const [itens, setItens] = useState<LinhaPiloto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const pedido = useRef(0);
  const cursorRef = useRef<string | null>(null);
  const ocupado = useRef(false);
  const saltos = useRef(0);
  const observador = useRef<IntersectionObserver | null>(null);

  const aplicarCursor = (proximo: string | null) => {
    cursorRef.current = proximo;
    setCursor(proximo);
  };

  const carregar = useCallback(async () => {
    const id = pedido.current + 1;
    pedido.current = id;
    ocupado.current = true;
    setCarregando(true);
    setErro(null);
    setNaoEncontrado(false);
    try {
      const pagina = await seguirService.listar(uid, aba, null);
      if (id !== pedido.current) return;
      setItens(pagina.itens);
      aplicarCursor(pagina.proximoCursor);
    } catch (erroApi) {
      if (id !== pedido.current) return;
      setItens([]);
      aplicarCursor(null);
      if (erroApi instanceof ApiError && erroApi.status === 404) {
        setNaoEncontrado(true);
        return;
      }
      setErro("Não deu para carregar.");
    } finally {
      if (id === pedido.current) {
        ocupado.current = false;
        setCarregando(false);
      }
    }
  }, [uid, aba]);

  const carregarMais = useCallback(async () => {
    const proximo = cursorRef.current;
    const id = pedido.current;
    if (!proximo || ocupado.current) return;
    ocupado.current = true;
    setCarregandoMais(true);
    try {
      const pagina = await seguirService.listar(uid, aba, proximo);
      if (id !== pedido.current) return;
      setItens((atual) => juntar(atual, pagina.itens));
      aplicarCursor(pagina.proximoCursor);
    } catch {
      if (id !== pedido.current) return;
      setErro("Não deu para carregar.");
    } finally {
      if (id === pedido.current) {
        ocupado.current = false;
        setCarregandoMais(false);
      }
    }
  }, [uid, aba]);

  useEffect(() => () => observador.current?.disconnect(), []);

  useEffect(() => {
    cursorRef.current = null;
    setCursor(null);
    setItens([]);
    saltos.current = 0;
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (carregando || carregandoMais || erro) return;
    if (!cursorRef.current || itens.length > 0 || !cursor) {
      saltos.current = 0;
      return;
    }
    if (saltos.current >= 5) return;
    saltos.current += 1;
    void carregarMais();
  }, [carregando, carregandoMais, erro, itens.length, cursor, carregarMais]);

  const sentinelaRef = useCallback(
    (node: HTMLDivElement | null) => {
      observador.current?.disconnect();
      observador.current = null;
      if (!node || !cursor) return;
      const root = node.closest("[data-scroll-app]");
      const obs = new IntersectionObserver(
        (entradas) => {
          if (entradas.some((entrada) => entrada.isIntersecting)) {
            void carregarMais();
          }
        },
        { root: root instanceof Element ? root : null, rootMargin: "160px" },
      );
      obs.observe(node);
      observador.current = obs;
    },
    [cursor, carregarMais],
  );

  return {
    itens,
    cursor,
    carregando,
    carregandoMais,
    erro,
    naoEncontrado,
    sentinelaRef,
    recarregar: carregar,
  };
};
