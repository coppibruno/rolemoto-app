"use client";

import { useEffect, useState } from "react";
import { geocodeService, type SugestaoEndereco } from "../services/geocode.service";

const DEBOUNCE_MS = 400;

export const useBuscaEndereco = () => {
  const [texto, setTexto] = useState("");
  const [sugestoes, setSugestoes] = useState<SugestaoEndereco[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (texto.trim().length < 3) {
      setSugestoes([]);
      setBuscando(false);
      return;
    }

    const id = window.setTimeout(async () => {
      setBuscando(true);
      const itens = await geocodeService.buscar(texto);
      setSugestoes(itens);
      setBuscando(false);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(id);
  }, [texto]);

  const limpar = () => {
    setTexto("");
    setSugestoes([]);
  };

  return { texto, setTexto, sugestoes, buscando, limpar };
};
