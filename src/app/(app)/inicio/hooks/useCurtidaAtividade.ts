"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { inicioService } from "../services/inicio.service";
import { DURACAO_TOAST_MS } from "../constants";

type EstadoCurtida = {
  curtidoPorMim: boolean;
  totalCurtidas: number;
};

export const useCurtidaAtividade = (
  id: string,
  inicial: EstadoCurtida,
  onMudou?: (estado: EstadoCurtida) => void,
) => {
  const [curtido, setCurtido] = useState(inicial.curtidoPorMim);
  const [total, setTotal] = useState(inicial.totalCurtidas);
  const [toast, setToast] = useState<string | null>(null);
  const ocupado = useRef(false);

  useEffect(() => {
    setCurtido(inicial.curtidoPorMim);
    setTotal(inicial.totalCurtidas);
  }, [id, inicial.curtidoPorMim, inicial.totalCurtidas]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), DURACAO_TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  const aplicar = useCallback(
    (estado: EstadoCurtida) => {
      setCurtido(estado.curtidoPorMim);
      setTotal(estado.totalCurtidas);
      onMudou?.(estado);
    },
    [onMudou],
  );

  const alternar = useCallback(async () => {
    if (ocupado.current) return;
    const anterior = { curtidoPorMim: curtido, totalCurtidas: total };
    const otimista = curtido
      ? { curtidoPorMim: false, totalCurtidas: Math.max(0, total - 1) }
      : { curtidoPorMim: true, totalCurtidas: total + 1 };
    aplicar(otimista);
    ocupado.current = true;
    try {
      const resp = curtido
        ? await inicioService.descurtir(id)
        : await inicioService.curtir(id);
      aplicar({ curtidoPorMim: resp.curtido, totalCurtidas: resp.totalCurtidas });
    } catch {
      aplicar(anterior);
      setToast("Não foi possível atualizar a curtida.");
    } finally {
      ocupado.current = false;
    }
  }, [aplicar, curtido, id, total]);

  const curtirSo = useCallback(async () => {
    if (curtido || ocupado.current) return;
    await alternar();
  }, [alternar, curtido]);

  return { curtido, total, toast, alternar, curtirSo };
};
