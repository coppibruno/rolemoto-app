"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { RoleTelemetria } from "@/types/role-telemetria";
import { telemetriaService } from "../../services/telemetria.service";

export const useTelemetriaDetalhe = (id: string) => {
  const [doc, setDoc] = useState<RoleTelemetria | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    telemetriaService
      .buscar(id)
      .then((resposta) => {
        if (cancelado) return;
        setDoc(resposta);
      })
      .catch((e) => {
        if (cancelado) return;
        setDoc(null);
        setErro(e instanceof ApiError ? e.message : "Não foi possível carregar");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  return { doc, carregando, erro };
};
