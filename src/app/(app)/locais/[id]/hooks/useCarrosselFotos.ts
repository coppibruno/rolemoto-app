"use client";

import { useRef, useState } from "react";

export const useCarrosselFotos = (total: number) => {
  const trilhoRef = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);

  const aoRolar = () => {
    const el = trilhoRef.current;
    if (!el || el.clientWidth === 0) return;
    const proximo = Math.min(
      Math.max(total - 1, 0),
      Math.max(0, Math.round(el.scrollLeft / el.clientWidth)),
    );
    setIndice((atual) => (atual === proximo ? atual : proximo));
  };

  const irPara = (destino: number) => {
    const el = trilhoRef.current;
    if (!el) return;
    const limite = Math.min(Math.max(destino, 0), Math.max(total - 1, 0));
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({
      left: limite * el.clientWidth,
      behavior: reduzido ? "auto" : "smooth",
    });
  };

  return { trilhoRef, indice, aoRolar, irPara };
};
