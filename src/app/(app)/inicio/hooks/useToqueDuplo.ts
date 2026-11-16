"use client";

import { useRef, type MouseEvent } from "react";

const JANELA_TOQUE_DUPLO_MS = 300;

/** Dois toques seguidos no mesmo elemento, no celular e no mouse. */
export const useToqueDuplo = (aoToqueDuplo: () => void) => {
  const ultimoToqueRef = useRef(0);

  return (evento: MouseEvent) => {
    const agora = evento.timeStamp;
    if (agora - ultimoToqueRef.current < JANELA_TOQUE_DUPLO_MS) {
      ultimoToqueRef.current = 0;
      window.getSelection()?.removeAllRanges();
      aoToqueDuplo();
      return;
    }
    ultimoToqueRef.current = agora;
  };
};
