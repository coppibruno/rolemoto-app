"use client";

import { useCallback, useEffect, useState } from "react";
import { ERRO_NOTIFICAR } from "../constants";
import { participacaoService } from "../services/participacao.service";

export const usePreferenciaNotificar = (
  roleId: string,
  inicial: boolean
) => {
  const [notificar, setNotificar] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setNotificar(inicial);
  }, [inicial]);

  const alternar = useCallback(async () => {
    if (salvando) return;
    const proximo = !notificar;
    setNotificar(proximo);
    setErro(null);
    setSalvando(true);
    try {
      await participacaoService.atualizarNotificar(roleId, proximo);
    } catch {
      setNotificar(!proximo);
      setErro(ERRO_NOTIFICAR);
    } finally {
      setSalvando(false);
    }
  }, [notificar, roleId, salvando]);

  return { notificar, salvando, erro, alternar };
};
