"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { ComentarioPost } from "@/types/post-foto";
import { postsService } from "@/app/(app)/perfil/services/posts.service";

/** A API devolve do mais novo para o mais antigo; `itens` segue essa ordem. */
export const useComentariosPost = (postId: string, mudarTotal: (delta: number) => void) => {
  const [itens, setItens] = useState<ComentarioPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(false);
    try {
      const pagina = await postsService.comentarios(postId, null);
      setItens(pagina.itens);
      setCursor(pagina.proximoCursor);
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, [postId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const carregarAnteriores = async () => {
    if (!cursor || carregandoMais) return;
    setCarregandoMais(true);
    try {
      const pagina = await postsService.comentarios(postId, cursor);
      setItens((atual) => {
        const vistos = new Set(atual.map((item) => item.id));
        return [...atual, ...pagina.itens.filter((item) => !vistos.has(item.id))];
      });
      setCursor(pagina.proximoCursor);
    } catch {
      setErro(true);
    } finally {
      setCarregandoMais(false);
    }
  };

  const enviar = async (texto: string): Promise<boolean> => {
    if (!texto.trim() || enviando) return false;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const novo = await postsService.comentar(postId, texto);
      setItens((atual) => [novo, ...atual]);
      mudarTotal(1);
      return true;
    } catch (e) {
      setErroEnvio(e instanceof ApiError ? e.message : "Não foi possível comentar.");
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const apagar = async (comentarioId: string) => {
    if (!window.confirm("Apagar comentário?")) return;
    try {
      await postsService.apagarComentario(postId, comentarioId);
      setItens((atual) => atual.filter((item) => item.id !== comentarioId));
      mudarTotal(-1);
    } catch (e) {
      setErroEnvio(e instanceof ApiError ? e.message : "Não foi possível apagar o comentário.");
    }
  };

  return {
    itens,
    cursor,
    carregando,
    carregandoMais,
    erro,
    recarregar: carregar,
    carregarAnteriores,
    enviando,
    erroEnvio,
    enviar,
    apagar,
  };
};
