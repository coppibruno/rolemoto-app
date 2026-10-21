"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { RoleTelemetria } from "@/types/role-telemetria";
import { telemetriaService } from "../../services/telemetria.service";

export const useTelemetriaDetalhe = (id: string) => {
  const [doc, setDoc] = useState<RoleTelemetria | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvandoVisibilidade, setSalvandoVisibilidade] = useState(false);

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

  const setPublica = useCallback(
    async (publica: boolean) => {
      if (!doc || salvandoVisibilidade) return;
      const anterior = doc.publica;
      setDoc({ ...doc, publica });
      setSalvandoVisibilidade(true);
      try {
        const atualizado = await telemetriaService.atualizarVisibilidade(
          id,
          publica,
        );
        setDoc(atualizado);
      } catch {
        setDoc({ ...doc, publica: anterior });
        setErro("Não foi possível atualizar quem vê o passeio.");
      } finally {
        setSalvandoVisibilidade(false);
      }
    },
    [doc, id, salvandoVisibilidade],
  );

  return { doc, carregando, erro, salvandoVisibilidade, setPublica };
};
