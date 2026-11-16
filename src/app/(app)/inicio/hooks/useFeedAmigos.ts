"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { guardarCache, useHidratarCache } from "@/hooks/useCacheRetorno";
import type { ItemAtividade } from "@/types/atividade";
import { CHAVE_CACHE_INICIO } from "../constants";
import { inicioService } from "../services/inicio.service";

type CacheInicio = {
  itens: ItemAtividade[];
  cursor: string | null;
};

export const useFeedAmigos = (ativo: boolean) => {
  const [itens, setItens] = useState<ItemAtividade[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const observador = useRef<IntersectionObserver | null>(null);
  const pedindo = useRef(false);

  useHidratarCache<CacheInicio>(
    ativo ? CHAVE_CACHE_INICIO : null,
    (cache) => {
      setItens(cache.itens);
      setCursor(cache.cursor);
      cursorRef.current = cache.cursor;
    },
  );

  const persistir = useCallback((lista: ItemAtividade[], proximo: string | null) => {
    guardarCache(CHAVE_CACHE_INICIO, { itens: lista, cursor: proximo } satisfies CacheInicio);
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const pagina = await inicioService.pagina(null);
      setItens(pagina.itens);
      setCursor(pagina.proximoCursor);
      cursorRef.current = pagina.proximoCursor;
      persistir(pagina.itens, pagina.proximoCursor);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setItens([]);
        setCursor(null);
        cursorRef.current = null;
      }
      setErro("Não foi possível carregar o feed.");
    } finally {
      setCarregando(false);
    }
  }, [persistir]);

  const carregarMais = useCallback(async () => {
    const atual = cursorRef.current;
    if (!atual || pedindo.current) return;
    pedindo.current = true;
    setCarregandoMais(true);
    setErro(null);
    try {
      const pagina = await inicioService.pagina(atual);
      setItens((antes) => {
        const ids = new Set(antes.map((i) => i.id));
        const novos = [...antes, ...pagina.itens.filter((i) => !ids.has(i.id))];
        persistir(novos, pagina.proximoCursor);
        return novos;
      });
      setCursor(pagina.proximoCursor);
      cursorRef.current = pagina.proximoCursor;
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setErro("Cursor inválido. Recarregue o feed.");
        setCursor(null);
        cursorRef.current = null;
      } else {
        setErro("Não foi possível carregar mais.");
      }
    } finally {
      setCarregandoMais(false);
      pedindo.current = false;
    }
  }, [persistir]);

  useEffect(() => {
    if (!ativo) return;
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    inicioService
      .pagina(null)
      .then((pagina) => {
        if (cancelado) return;
        setItens(pagina.itens);
        setCursor(pagina.proximoCursor);
        cursorRef.current = pagina.proximoCursor;
        persistir(pagina.itens, pagina.proximoCursor);
      })
      .catch((e) => {
        if (cancelado) return;
        if (e instanceof ApiError && e.status === 400) {
          setItens([]);
          setCursor(null);
          cursorRef.current = null;
        }
        setErro("Não foi possível carregar o feed.");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [ativo, persistir]);

  const atualizarItem = useCallback(
    (id: string, patch: Partial<ItemAtividade>) => {
      setItens((antes) => {
        const novos = antes.map((item) => (item.id === id ? { ...item, ...patch } : item));
        persistir(novos, cursorRef.current);
        return novos;
      });
    },
    [persistir],
  );

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
    sentinelaRef,
    carregarMais,
    recarregar: carregar,
    atualizarItem,
  };
};
