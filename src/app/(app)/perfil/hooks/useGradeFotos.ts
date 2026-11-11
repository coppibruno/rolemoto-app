"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ItemGradePost } from "@/types/post-foto";
import { postsService } from "../services/posts.service";

const juntar = (atual: ItemGradePost[], novos: ItemGradePost[]) => {
  const vistos = new Set(atual.map((item) => item.id));
  return [...atual, ...novos.filter((item) => !vistos.has(item.id))];
};

export const useGradeFotos = (uid: string) => {
  const [itens, setItens] = useState<ItemGradePost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState(false);
  const pedido = useRef(0);

  const carregar = useCallback(async () => {
    const id = ++pedido.current;
    setCarregando(true);
    setErro(false);
    try {
      const pagina = await postsService.grade(uid, null);
      if (id !== pedido.current) return;
      setItens(pagina.itens);
      setCursor(pagina.proximoCursor);
    } catch {
      if (id === pedido.current) setErro(true);
    } finally {
      if (id === pedido.current) setCarregando(false);
    }
  }, [uid]);

  const carregarMais = useCallback(async () => {
    if (!cursor || carregandoMais) return;
    const id = pedido.current;
    setCarregandoMais(true);
    try {
      const pagina = await postsService.grade(uid, cursor);
      if (id !== pedido.current) return;
      setItens((atual) => juntar(atual, pagina.itens));
      setCursor(pagina.proximoCursor);
    } catch {
      if (id === pedido.current) setErro(true);
    } finally {
      setCarregandoMais(false);
    }
  }, [uid, cursor, carregandoMais]);

  useEffect(() => {
    if (uid) void carregar();
  }, [uid, carregar]);

  return { itens, cursor, carregando, carregandoMais, erro, carregarMais, recarregar: carregar };
};
