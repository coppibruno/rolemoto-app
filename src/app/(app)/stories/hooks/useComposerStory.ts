"use client";

import { useEffect, useMemo, useState } from "react";
import type { StoryPublica } from "@/types/story-local";
import {
  useMencoesStory,
  usePublicarStoryPerfil,
  type MencaoOpcao,
} from "./usePublicarStoryPerfil";

type Params = {
  arquivo: File;
  marcaInicial: MencaoOpcao | null;
  onPublicada: (story: StoryPublica) => void;
};

export const useComposerStory = ({ arquivo, marcaInicial, onPublicada }: Params) => {
  const [escolhida, setEscolhida] = useState<MencaoOpcao | null>(marcaInicial);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const { opcoes, perto } = useMencoesStory(true);
  const { publicar, enviando, erro } = usePublicarStoryPerfil();

  useEffect(() => {
    const url = URL.createObjectURL(arquivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  const consulta = termo.trim().toLocaleLowerCase();
  const pertoVisivel = Boolean(
    perto && (!consulta || perto.nome.toLocaleLowerCase().includes(consulta)),
  );
  const lista = useMemo(() => {
    const base = opcoes.filter((item) => !perto || item.tipo !== perto.tipo || item.id !== perto.id);
    return base
      .filter((item) => !consulta || item.nome.toLocaleLowerCase().includes(consulta))
      .slice(0, pertoVisivel ? 7 : 8);
  }, [consulta, opcoes, perto, pertoVisivel]);

  const escolher = (marca: MencaoOpcao) => {
    setEscolhida(marca);
    setBuscaAberta(false);
    setTermo("");
  };

  const enviar = async () => {
    const story = await publicar(arquivo, escolhida);
    if (story) onPublicada(story);
  };

  return {
    preview,
    escolhida,
    buscaAberta,
    setBuscaAberta,
    termo,
    setTermo,
    lista,
    perto: pertoVisivel ? perto : null,
    escolher,
    tirarMarca: () => setEscolhida(null),
    enviar,
    enviando,
    erro,
    semResultado: buscaAberta && !pertoVisivel && lista.length === 0 && termo.trim().length > 0,
  };
};
