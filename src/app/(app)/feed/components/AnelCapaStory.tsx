"use client";

import { useEffect, useState } from "react";
import type { AlvoPlayer } from "@/types/story-local";
import { storiesService } from "@/app/(app)/stories/services/stories.service";
import { AnelStory } from "./AnelStory";

type Props = {
  alvo: AlvoPlayer;
  nome: string;
  contagem: number;
  onAbrir: () => void;
};

export const AnelCapaStory = ({ alvo, nome, contagem, onAbrir }: Props) => {
  const [fotoUrl, setFotoUrl] = useState("");
  const { tipo, id } = alvo;

  useEffect(() => {
    let cancelado = false;
    storiesService
      .listar({ tipo, id })
      .then((lista) => {
        if (cancelado) return;
        const ultima = lista.stories[lista.stories.length - 1];
        setFotoUrl(ultima?.fotoUrl ?? "");
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [tipo, id]);

  return (
    <AnelStory
      nome={nome}
      fotoUrl={fotoUrl}
      contagem={contagem}
      naoVisto
      onAbrir={onAbrir}
    />
  );
};
