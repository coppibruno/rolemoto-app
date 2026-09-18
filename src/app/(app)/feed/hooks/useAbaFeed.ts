"use client";

import { useEffect, useState } from "react";
import { ABA_PADRAO, STORAGE_ABA } from "../constants";
import type { AbaFeed } from "../types";

const isAbaFeed = (valor: string): valor is AbaFeed =>
  valor === "roles" || valor === "eventos" || valor === "locais";

const lerAbaSalva = (): AbaFeed => {
  if (typeof window === "undefined") return ABA_PADRAO;
  try {
    const salva = sessionStorage.getItem(STORAGE_ABA);
    if (salva && isAbaFeed(salva)) return salva;
  } catch {
    /* ignore */
  }
  return ABA_PADRAO;
};

export const useAbaFeed = () => {
  const [aba, setAbaState] = useState<AbaFeed>(ABA_PADRAO);

  useEffect(() => {
    setAbaState(lerAbaSalva());
  }, []);

  const setAba = (proxima: AbaFeed) => {
    setAbaState(proxima);
    try {
      sessionStorage.setItem(STORAGE_ABA, proxima);
    } catch {
      /* ignore */
    }
  };

  return { aba, setAba };
};
