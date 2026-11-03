"use client";

import { useLayoutEffect, useRef } from "react";
import { lerLista, reposicionarRolagem, salvarLista } from "@/lib/retorno-tela";

/** Mostra a última lista da sessão enquanto a tela busca de novo. */
export const useHidratarCache = <T>(
  chave: string | null,
  aplicar: (valor: T) => void,
  limpar?: () => void,
) => {
  const aplicarRef = useRef(aplicar);
  const limparRef = useRef(limpar);
  aplicarRef.current = aplicar;
  limparRef.current = limpar;

  useLayoutEffect(() => {
    if (!chave) return;
    const cache = lerLista<T>(chave);
    if (cache == null) {
      limparRef.current?.();
      return;
    }
    aplicarRef.current(cache);
    reposicionarRolagem();
  }, [chave]);
};

export const guardarCache = <T>(chave: string, valor: T) => {
  salvarLista(chave, valor);
  reposicionarRolagem();
};
