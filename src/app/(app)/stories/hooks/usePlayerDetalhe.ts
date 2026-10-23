"use client";

import { useCallback, useState } from "react";
import type { StoryPublica } from "@/types/story-local";
import { useAbrirStoriesDaUrl } from "./useAbrirStoriesDaUrl";

export const usePlayerDetalhe = (pronto: boolean) => {
  const [aberto, setAberto] = useState(false);
  const [destaqueId, setDestaqueId] = useState<string | null>(null);
  const [inicial, setInicial] = useState<StoryPublica | null>(null);

  const abrir = useCallback((id: string | null = null, story: StoryPublica | null = null) => {
    setDestaqueId(story?.id ?? id);
    setInicial(story);
    setAberto(true);
  }, []);

  const fechar = useCallback(() => {
    setAberto(false);
    setDestaqueId(null);
    setInicial(null);
  }, []);

  useAbrirStoriesDaUrl(pronto, () => abrir(null));

  return { aberto, destaqueId, inicial, abrir, fechar };
};
