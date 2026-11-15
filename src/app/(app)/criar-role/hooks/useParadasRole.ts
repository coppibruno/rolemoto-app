"use client";

import { useCallback, useState } from "react";
import { MAX_PARADAS } from "@/lib/mapa-viagem/viagem";
import type { Localizacao } from "@/types/role";
import { incluirParada, moverParada, removerParada } from "../paradas";

export const useParadasRole = () => {
  const [paradas, setParadas] = useState<Localizacao[]>([]);
  const [editando, setEditando] = useState(false);

  const preencher = useCallback((lista: Localizacao[]) => {
    setParadas(lista.slice(0, MAX_PARADAS));
  }, []);

  const incluir = (ponto: Localizacao) => {
    setParadas((lista) => incluirParada(lista, ponto));
    setEditando(false);
  };

  return {
    paradas,
    cheio: paradas.length >= MAX_PARADAS,
    editando,
    abrirEditor: () => setEditando(true),
    fecharEditor: () => setEditando(false),
    incluir,
    subir: (indice: number) => setParadas((lista) => moverParada(lista, indice, -1)),
    descer: (indice: number) => setParadas((lista) => moverParada(lista, indice, 1)),
    remover: (indice: number) => setParadas((lista) => removerParada(lista, indice)),
    preencher,
  };
};
