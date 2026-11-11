"use client";

import { useMemo, useState } from "react";
import {
  useMencoesStory,
  type MencaoOpcao,
} from "@/app/(app)/stories/hooks/usePublicarStoryPerfil";

/** A mesma lista de local e evento do composer de story, sem o “perto de você” (sem GPS). */
export const useBuscaMarca = (onEscolher: (marca: MencaoOpcao) => void) => {
  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const { opcoes } = useMencoesStory(aberta, false);

  const consulta = termo.trim().toLocaleLowerCase();
  const lista = useMemo(
    () => opcoes
      .filter((item) => !consulta || item.nome.toLocaleLowerCase().includes(consulta))
      .slice(0, 8),
    [consulta, opcoes],
  );

  const escolher = (marca: MencaoOpcao) => {
    onEscolher(marca);
    setAberta(false);
    setTermo("");
  };

  return {
    aberta,
    abrir: () => setAberta(true),
    fechar: () => setAberta(false),
    termo,
    setTermo,
    lista,
    semResultado: lista.length === 0 && consulta.length > 0,
    escolher,
  };
};
