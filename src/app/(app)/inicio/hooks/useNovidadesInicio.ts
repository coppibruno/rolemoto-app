"use client";

import { useCallback, useEffect, useState } from "react";
import { INTERVALO_NOVIDADES_MS } from "../constants";
import { inicioService } from "../services/inicio.service";

export const useNovidadesInicio = (desde: string | null, ativo: boolean) => {
  const [total, setTotal] = useState(0);

  const consultar = useCallback(async () => {
    if (!desde || !ativo) {
      setTotal(0);
      return;
    }
    try {
      const resp = await inicioService.novidades(desde);
      setTotal(resp.total);
    } catch {
      /* silencioso: a pílula é best-effort */
    }
  }, [ativo, desde]);

  useEffect(() => {
    void consultar();
  }, [consultar]);

  useEffect(() => {
    if (!ativo || !desde) return;
    const id = window.setInterval(() => void consultar(), INTERVALO_NOVIDADES_MS);
    const aoFoco = () => {
      if (document.visibilityState === "visible") void consultar();
    };
    document.addEventListener("visibilitychange", aoFoco);
    window.addEventListener("focus", aoFoco);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", aoFoco);
      window.removeEventListener("focus", aoFoco);
    };
  }, [ativo, desde, consultar]);

  const zerar = useCallback(() => setTotal(0), []);

  return { total, zerar, consultar };
};
