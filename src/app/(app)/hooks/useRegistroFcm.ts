"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { dispositivosService } from "../services/dispositivos.service";
import {
  messagingSuportado,
  obterToken,
  type ResultadoPermissao,
} from "@/lib/fcm";
import {
  pedirPermissaoERegistrarNativo,
  registrarSeJaPermitidoNativo,
} from "@/lib/fcm-nativo";

let recusouNestaSessao = false;

const registrarTokenAtual = async (): Promise<void> => {
  const token = await obterToken();
  if (!token) {
    return;
  }
  await dispositivosService.registrar(token, "web");
};

export const registrarSeJaPermitido = async (): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      await registrarSeJaPermitidoNativo();
      return;
    }
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
    if (Capacitor.isNativePlatform()) {
      return pedirPermissaoERegistrarNativo();
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    if (Notification.permission === "denied" || recusouNestaSessao) {
      recusouNestaSessao = true;
      return "denied";
    }

    // requestPermission precisa rodar ainda no gesto do clique — nenhum await antes.
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

    if (!(await messagingSuportado())) {
      return "unsupported";
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
