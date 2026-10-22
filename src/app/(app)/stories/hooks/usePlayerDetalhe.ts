"use client";

import { useCallback, useState } from "react";
import { useAbrirStoriesDaUrl } from "./useAbrirStoriesDaUrl";

export const usePlayerDetalhe = (pronto: boolean) => {
  const [aberto, setAberto] = useState(false);
  const [destaqueId, setDestaqueId] = useState<string | null>(null);

  const abrir = useCallback((id: string | null = null) => {
    setDestaqueId(id);
    setAberto(true);
  }, []);

  const fechar = useCallback(() => {
    setAberto(false);
    setDestaqueId(null);
  }, []);

  useAbrirStoriesDaUrl(pronto, () => abrir(null));

  return { aberto, destaqueId, abrir, fechar };
};
