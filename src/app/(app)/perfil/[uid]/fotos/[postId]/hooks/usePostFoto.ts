"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import type { DetalhePost } from "@/types/post-foto";
import { idAtividadeFoto } from "@/types/atividade";
import { recarregarTemStories } from "@/app/(app)/stories/hooks/useTemStories";
import { postsService } from "@/app/(app)/perfil/services/posts.service";
import { inicioService } from "@/app/(app)/inicio/services/inicio.service";

const CONFIRMA_APAGAR =
  "Apagar esta foto? Os comentários saem junto. O story de quem encaminhou continua até expirar.";

export const usePostFoto = (postId: string) => {
  const router = useRouter();
  const { usuario } = useAuth();
  const [post, setPost] = useState<DetalhePost | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(false);
    setNaoEncontrado(false);
    try {
      const detalhe = await postsService.detalhe(postId);
      setPost({
        ...detalhe,
        curtidoPorMim: detalhe.curtidoPorMim === true,
        totalCurtidas: detalhe.totalCurtidas ?? 0,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNaoEncontrado(true);
      else setErro(true);
    } finally {
      setCarregando(false);
    }
  }, [postId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const encaminhar = async () => {
    if (!post || post.encaminhadoPorMim || ocupado) return;
    setOcupado(true);
    setErroAcao(null);
    try {
      await postsService.encaminhar(post.id);
      setPost({ ...post, encaminhadoPorMim: true });
      if (usuario) void recarregarTemStories(usuario.uid);
    } catch (e) {
      setErroAcao(e instanceof ApiError ? e.message : "Não foi possível adicionar ao story.");
    } finally {
      setOcupado(false);
    }
  };

  const apagar = async () => {
    if (!post || ocupado || !window.confirm(CONFIRMA_APAGAR)) return;
    setOcupado(true);
    setErroAcao(null);
    try {
      await postsService.apagar(post.id);
      router.replace("/perfil");
    } catch (e) {
      setErroAcao(e instanceof ApiError ? e.message : "Não foi possível apagar a foto.");
      setOcupado(false);
    }
  };

  const mudarTotal = useCallback((delta: number) => {
    setPost((atual) =>
      atual ? { ...atual, totalComentarios: Math.max(0, atual.totalComentarios + delta) } : atual,
    );
  }, []);

  const alternarCurtida = async () => {
    if (!post || ocupado) return;
    const anterior = {
      curtidoPorMim: post.curtidoPorMim,
      totalCurtidas: post.totalCurtidas,
    };
    const otimista = post.curtidoPorMim
      ? { curtidoPorMim: false, totalCurtidas: Math.max(0, post.totalCurtidas - 1) }
      : { curtidoPorMim: true, totalCurtidas: post.totalCurtidas + 1 };
    setPost({ ...post, ...otimista });
    setOcupado(true);
    setErroAcao(null);
    try {
      const id = idAtividadeFoto(post.id);
      const resp = post.curtidoPorMim
        ? await inicioService.descurtir(id)
        : await inicioService.curtir(id);
      setPost((atual) =>
        atual
          ? { ...atual, curtidoPorMim: resp.curtido, totalCurtidas: resp.totalCurtidas }
          : atual,
      );
    } catch (e) {
      setPost((atual) => (atual ? { ...atual, ...anterior } : atual));
      setErroAcao(e instanceof ApiError ? e.message : "Não foi possível atualizar a curtida.");
    } finally {
      setOcupado(false);
    }
  };

  const curtirSo = async () => {
    if (!post || ocupado || post.curtidoPorMim) return;
    await alternarCurtida();
  };

  return {
    post,
    carregando,
    naoEncontrado,
    erro,
    recarregar: carregar,
    meu: Boolean(post && usuario?.uid === post.autor.uid),
    ocupado,
    erroAcao,
    encaminhar,
    apagar,
    alternarCurtida,
    curtirSo,
    mudarTotal,
  };
};
