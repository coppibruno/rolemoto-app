"use client";

import { useEffect, useState } from "react";
import { publicarSeguir } from "@/lib/seguir-contadores";
import { seguirService } from "../services/seguir.service";

const TOAST = "Não deu para atualizar";

export const useSeguirPiloto = (uid: string, seguidoInicial: boolean) => {
  const [seguido, setSeguido] = useState(seguidoInicial);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setSeguido(seguidoInicial);
  }, [uid, seguidoInicial]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const falhar = (anterior: boolean) => {
    setSeguido(anterior);
    setToast(TOAST);
  };

  const seguir = async () => {
    if (enviando || seguido) return;
    const anterior = seguido;
    setSeguido(true);
    setEnviando(true);
    try {
      await seguirService.seguir(uid);
      publicarSeguir({ uid, delta: 1 });
    } catch {
      falhar(anterior);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarDeixar = async () => {
    if (enviando) return;
    setConfirmando(false);
    const anterior = seguido;
    setSeguido(false);
    setEnviando(true);
    try {
      await seguirService.deixar(uid);
      publicarSeguir({ uid, delta: -1 });
    } catch {
      falhar(anterior);
    } finally {
      setEnviando(false);
    }
  };

  const aoClicar = () => {
    if (enviando) return;
    if (seguido) {
      setConfirmando(true);
      return;
    }
    void seguir();
  };

  return {
    seguido,
    confirmando,
    enviando,
    toast,
    aoClicar,
    cancelar: () => setConfirmando(false),
    confirmarDeixar,
    fecharToast: () => setToast(null),
  };
};
