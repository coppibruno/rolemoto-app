"use client";

import { useEffect, useState } from "react";
import {
  CICLO_RAIO,
  DEBOUNCE_BUSCA_MS,
  QUANDO_PADRAO,
  RAIO_PADRAO,
  RITMO_PADRAO,
} from "../constants";
import type { FiltroQuando, FiltroRitmo, RaioKm } from "../types";

export const useFiltrosFeed = () => {
  const [raioKm, setRaioKm] = useState<RaioKm>(RAIO_PADRAO);
  const [quando, setQuando] = useState<FiltroQuando | null>(QUANDO_PADRAO);
  const [ritmo, setRitmo] = useState<FiltroRitmo>(RITMO_PADRAO);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setBuscaDebounced(busca), DEBOUNCE_BUSCA_MS);
    return () => window.clearTimeout(id);
  }, [busca]);

  const ciclarRaio = () => {
    const idx = CICLO_RAIO.indexOf(raioKm);
    const proximo = CICLO_RAIO[(idx + 1) % CICLO_RAIO.length];
    setRaioKm(proximo);
  };

  const alternarQuando = (valor: Exclude<FiltroQuando, { tipo: "data" }>) => {
    setQuando((atual) => (atual === valor ? null : valor));
  };

  const escolherData = (iso: string) => {
    setQuando({ tipo: "data", iso });
  };

  const limparData = () => {
    setQuando((atual) =>
      atual && typeof atual === "object" ? null : atual
    );
  };

  return {
    raioKm,
    setRaioKm,
    ciclarRaio,
    quando,
    alternarQuando,
    escolherData,
    limparData,
    ritmo,
    setRitmo,
    busca,
    setBusca,
    buscaDebounced,
  };
};
