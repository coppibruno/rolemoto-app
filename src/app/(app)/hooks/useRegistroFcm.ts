"use client";

import { useEffect } from "react";
import { dispositivosService } from "../services/dispositivos.service";
import {
  messagingSuportado,
  obterToken,
  type ResultadoPermissao,
} from "@/lib/fcm";

let recusouNestaSessao = false;

const registrarTokenAtual = async (): Promise<void> => {
  const token = await obterToken();
  if (!token) {
    return;
  }
  await dispositivosService.registrar(token);
};

export const registrarSeJaPermitido = async (): Promise<void> => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    if (Notification.permission !== "granted") {
      return;
    }
    await registrarTokenAtual();
  } catch {
    return;
  }
};

export const pedirPermissaoERegistrar = async (): Promise<ResultadoPermissao> => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    if (!(await messagingSuportado())) {
      return "unsupported";
    }

    if (Notification.permission === "denied" || recusouNestaSessao) {
      recusouNestaSessao = true;
      return "denied";
    }

    let permissao = Notification.permission as NotificationPermission;
    if (permissao === "default") {
      permissao = await Notification.requestPermission();
    }

    if (permissao === "denied") {
      recusouNestaSessao = true;
      return "denied";
    }
    if (permissao !== "granted") {
      return "default";
    }

    await registrarTokenAtual();
    return "granted";
  } catch {
    return "unsupported";
  }
};

export const useRegistroFcm = () => {
  useEffect(() => {
    void registrarSeJaPermitido();
  }, []);
};
