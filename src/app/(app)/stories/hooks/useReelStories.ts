"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AlvoPlayer, StoryPublica } from "@/types/story-local";
import { alvoDaStory } from "@/types/story-local";
import { storiesService } from "../services/stories.service";

const DURACAO_MS = 5000;

type Params = {
  aberto: boolean;
  alvo: AlvoPlayer | null;
  destaqueId?: string | null;
  onFechar: () => void;
  onMudou?: () => void;
};

export const useReelStories = ({
  aberto,
  alvo,
  destaqueId,
  onFechar,
  onMudou,
}: Params) => {
  const { firebaseUser } = useAuth();
  const [montado, setMontado] = useState(false);
  const [stories, setStories] = useState<StoryPublica[]>([]);
  const [indice, setIndice] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const progressoRef = useRef(0);
  const indiceRef = useRef(0);
  const storiesRef = useRef(stories);
  const segurouEm = useRef(0);
  const segurando = useRef(false);
  const onFecharRef = useRef(onFechar);
  onFecharRef.current = onFechar;
  indiceRef.current = indice;
  storiesRef.current = stories;

  const alvoTipo = alvo?.tipo ?? "";
  const alvoId = alvo?.id ?? "";

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto || !alvoId || (alvoTipo !== "local" && alvoTipo !== "evento" && alvoTipo !== "usuario")) {
      return;
    }
    const alvoAtual: AlvoPlayer = { tipo: alvoTipo, id: alvoId };
    let cancelado = false;
    setCarregando(true);
    setConfirmando(false);
    setPausado(false);
    setStories([]);
    storiesService
      .listar(alvoAtual)
      .then((lista) => {
        if (cancelado) return;
        setStories(lista.stories);
        const achou = destaqueId
          ? lista.stories.findIndex((item) => item.id === destaqueId)
          : 0;
        const proximo = achou >= 0 ? achou : 0;
        setIndice(proximo);
        progressoRef.current = 0;
        setProgresso(0);
      })
      .catch(() => {
        if (!cancelado) setStories([]);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [aberto, alvoTipo, alvoId, destaqueId]);

  const avancar = useCallback(() => {
    const proximo = indiceRef.current + 1;
    if (proximo >= storiesRef.current.length) {
      onFecharRef.current();
      return;
    }
    setIndice(proximo);
  }, []);

  const voltar = useCallback(() => {
    setIndice((atual) => Math.max(0, atual - 1));
  }, []);

  useEffect(() => {
    progressoRef.current = 0;
    setProgresso(0);
  }, [indice]);

  useEffect(() => {
    if (!aberto || pausado || confirmando || carregando || stories.length === 0) return;
    const base = progressoRef.current;
    const inicio = performance.now();
    let frame = 0;
    const tick = (agora: number) => {
      const pct = Math.min(100, base + ((agora - inicio) / DURACAO_MS) * 100);
      progressoRef.current = pct;
      setProgresso(pct);
      if (pct >= 100) {
        avancar();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [aberto, pausado, confirmando, carregando, stories.length, indice, avancar]);

  const story = stories[indice] ?? null;

  const storyId = story?.id ?? "";

  useEffect(() => {
    if (!aberto || !storyId || !story) return;
    const alvoStory = alvoDaStory(story);
    if (!alvoStory) return;
    storiesService.visto(alvoStory, storyId).catch(() => undefined);
  }, [aberto, storyId, story]);

  const segurar = () => {
    if (confirmando) return;
    segurando.current = true;
    segurouEm.current = performance.now();
    setPausado(true);
  };

  const soltar = (evento: ReactPointerEvent<HTMLDivElement>) => {
    if (!segurando.current) return;
    segurando.current = false;
    const durou = performance.now() - segurouEm.current;
    setPausado(false);
    if (durou > 220 || confirmando) return;
    const rect = evento.currentTarget.getBoundingClientRect();
    if (evento.clientX - rect.left < rect.width / 2) voltar();
    else avancar();
  };

  const cancelarToque = () => {
    segurando.current = false;
    setPausado(false);
  };

  const apagar = async () => {
    const alvoStory = story ? alvoDaStory(story) : null;
    if (!story || !alvoStory || apagando) return;
    setApagando(true);
    try {
      await storiesService.apagar(alvoStory, story.id);
      const restantes = stories.filter((item) => item.id !== story.id);
      onMudou?.();
      setConfirmando(false);
      if (restantes.length === 0) {
        onFechar();
        return;
      }
      setStories(restantes);
      setIndice((atual) => Math.min(atual, restantes.length - 1));
    } finally {
      setApagando(false);
    }
  };

  return {
    montado,
    stories,
    indice,
    progresso,
    carregando,
    confirmando,
    setConfirmando,
    apagando,
    story,
    minha: Boolean(story && firebaseUser?.uid === story.autor.uid),
    segurar,
    soltar,
    cancelarToque,
    apagar,
  };
};
