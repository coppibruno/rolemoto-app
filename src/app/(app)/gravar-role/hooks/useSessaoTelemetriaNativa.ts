"use client";

import { useCallback, useEffect, useState } from "react";
import { obterAdapterGps } from "@/lib/telemetria/telemetria-gps.adapter";
import { podeGravarTelemetriaNativa } from "@/lib/telemetria/plataforma";
import type { SessaoTelemetriaLocal } from "@/types/role-telemetria";
import { onSyncResumo } from "../services/sync-resumo-pendente";
import { useSyncResumoPendente } from "./useSyncResumoPendente";

export const useSessaoTelemetriaNativa = () => {
  const [sessao, setSessao] = useState<SessaoTelemetriaLocal | null>(null);
  const [resumoPendente, setResumoPendente] = useState(false);
  const [pronta, setPronta] = useState(false);

  const sincronizar = useCallback(async () => {
    try {
      const adapter = await obterAdapterGps();
      const atual = await adapter.getSession();
      const pendente = atual ? null : await adapter.getResumoPendente();
      setSessao(atual);
      setResumoPendente(pendente != null);
      setPronta(true);
      return atual;
    } catch {
      setSessao(null);
      setResumoPendente(false);
      setPronta(true);
      return null;
    }
  }, []);

  useEffect(() => {
    void sincronizar();
    if (!podeGravarTelemetriaNativa()) return;
    let remover: (() => void) | undefined;
    void import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) void sincronizar();
        }),
      )
      .then((handle) => {
        remover = () => {
          void handle.remove();
        };
      })
      .catch(() => {
        /* web: plugin ausente */
      });
    return () => remover?.();
  }, [sincronizar]);

  useEffect(() => {
    return onSyncResumo((resultado) => {
      if (resultado.tipo === "ok" || resultado.tipo === "vazio") {
        void sincronizar();
      }
    });
  }, [sincronizar]);

  useSyncResumoPendente(resumoPendente && !sessao, () => undefined);

  return { sessao, resumoPendente, pronta, sincronizar };
};
