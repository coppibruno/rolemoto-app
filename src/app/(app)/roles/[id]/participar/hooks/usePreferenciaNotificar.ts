"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ERRO_NOTIFICAR } from "../constants";
import { participacaoService } from "../services/participacao.service";
import { pedirPermissaoERegistrar } from "@/app/(app)/hooks/useRegistroFcm";

export const usePreferenciaNotificar = (
  roleId: string,
  inicial: boolean,
  pedirAoMontar = false,
) => {
  const [notificar, setNotificar] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pediuRef = useRef(false);

  useEffect(() => {
    setNotificar(inicial);
  }, [inicial]);

  useEffect(() => {
    if (pediuRef.current || !pedirAoMontar || !notificar) {
      return;
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    if (Notification.permission !== "default") {
      return;
    }
    pediuRef.current = true;
    void pedirPermissaoERegistrar();
  }, [pedirAoMontar, notificar]);

  const alternar = useCallback(async () => {
    if (salvando) return;
    const proximo = !notificar;
    setNotificar(proximo);
    setErro(null);
    setSalvando(true);
    try {
      if (proximo) {
        void pedirPermissaoERegistrar();
      }
      await participacaoService.atualizarNotificar(roleId, proximo);
    } catch (erro) {
      console.error(erro);
      setNotificar(!proximo);
      setErro(ERRO_NOTIFICAR);
    } finally {
      setSalvando(false);
    }
  }, [notificar, roleId, salvando]);

  return { notificar, salvando, erro, alternar };
};
