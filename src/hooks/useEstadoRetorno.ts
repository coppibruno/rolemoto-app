"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { lerEstado, salvarEstado } from "@/lib/retorno-tela";

/** Reaplica o estado da sessão antes do paint e grava de novo ao sair. */
export const useEstadoRetorno = <T>(
  chave: string,
  estado: T,
  aplicar: (salvo: T) => void,
) => {
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const aplicarRef = useRef(aplicar);
  aplicarRef.current = aplicar;
  const espelho = useRef<T | null>(null);
  const [pronto, setPronto] = useState(false);
  if (pronto) espelho.current = estado;

  useLayoutEffect(() => {
    const existente = lerEstado<T>(chave);
    if (existente != null) {
      espelho.current = existente;
      aplicarRef.current(existente);
    }
    setPronto(true);
    return () => {
      salvarEstado(chave, espelho.current ?? estadoRef.current);
    };
  }, [chave]);

  return pronto;
};
