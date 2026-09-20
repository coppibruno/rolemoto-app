"use client";

import { useCallback, useEffect, useState } from "react";
import { obterAdapterGps } from "@/lib/telemetria/telemetria-gps.adapter";
import { podeGravarTelemetriaNativa } from "@/lib/telemetria/plataforma";
import type { SessaoTelemetriaLocal } from "@/types/role-telemetria";

export const useSessaoTelemetriaNativa = () => {
  const [sessao, setSessao] = useState<SessaoTelemetriaLocal | null>(null);
  const [pronta, setPronta] = useState(false);

  const sincronizar = useCallback(async () => {
    try {
      const adapter = await obterAdapterGps();
      const atual = await adapter.getSession();
      setSessao(atual);
      setPronta(true);
      return atual;
    } catch {
      setSessao(null);
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

  return { sessao, pronta, sincronizar };
};
