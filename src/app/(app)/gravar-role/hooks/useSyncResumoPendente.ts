"use client";

import { useEffect } from "react";
import {
  agendarSyncResumoPendente,
  type ResultadoSyncResumo,
} from "../services/sync-resumo-pendente";

export const useSyncResumoPendente = (
  ativo: boolean,
  onResultado: (resultado: ResultadoSyncResumo) => void,
) => {
  useEffect(() => {
    if (!ativo) return;
    let cancelar: () => void = () => undefined;
    const disparar = () => {
      cancelar();
      cancelar = agendarSyncResumoPendente(onResultado);
    };
    window.addEventListener("online", disparar);
    let removerApp: (() => void) | undefined;
    void import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) disparar();
        }),
      )
      .then((handle) => {
        removerApp = () => {
          void handle.remove();
        };
      })
      .catch(() => {
        /* web: plugin ausente */
      });
    return () => {
      cancelar();
      window.removeEventListener("online", disparar);
      removerApp?.();
    };
  }, [ativo, onResultado]);
};
