"use client";

import { useCallback, useEffect, useState } from "react";
import type { PontoFeed, RaioKm } from "@/app/(app)/feed/types";
import type { AnelStory } from "@/types/story-local";
import { storiesService } from "../services/stories.service";

type Params = {
  aba: "locais" | "eventos";
  ponto: PontoFeed | null;
  raioKm: RaioKm;
};

export const useFaixaStories = ({ aba, ponto, raioKm }: Params) => {
  const [aneis, setAneis] = useState<AnelStory[]>([]);
  const [ticket, setTicket] = useState(0);
  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useEffect(() => {
    let cancelado = false;
    storiesService
      .aoVivo(aba, ponto, raioKm)
      .then((dados) => {
        if (!cancelado) setAneis(dados.aneis);
      })
      .catch(() => {
        if (!cancelado) setAneis([]);
      });
    return () => {
      cancelado = true;
    };
  }, [aba, ponto?.lat, ponto?.lng, raioKm, ticket]);

  return { aneis, recarregar };
};
