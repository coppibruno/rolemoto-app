"use client";

import { useCallback, useEffect, useState } from "react";

const CHAVE_DISPENSADO = "rolemoto.pwa.ctaDispensado";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type NavigatorStandalone = Navigator & { standalone?: boolean };

let eventoGuardado: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    eventoGuardado = evento as BeforeInstallPromptEvent;
  });
}

const eStandaloneAgora = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as NavigatorStandalone).standalone === true;

const eIosAgora = () => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.maxTouchPoints > 1 && /Mac/.test(ua);
};

export const useInstalacaoPwa = () => {
  const [eStandalone, setEStandalone] = useState(false);
  const [eIos, setEIos] = useState(false);
  const [dispensado, setDispensado] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [eventoNativo, setEventoNativo] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setEStandalone(eStandaloneAgora());
    setEIos(eIosAgora());
    setDispensado(localStorage.getItem(CHAVE_DISPENSADO) === "1");
    setEventoNativo(eventoGuardado);
    setPronto(true);

    const media = window.matchMedia("(display-mode: standalone)");
    const aoMudarStandalone = () => setEStandalone(eStandaloneAgora());
    media.addEventListener("change", aoMudarStandalone);

    const aoPrompt = (evento: Event) => {
      evento.preventDefault();
      const nativo = evento as BeforeInstallPromptEvent;
      eventoGuardado = nativo;
      setEventoNativo(nativo);
    };
    const aoInstalar = () => {
      eventoGuardado = null;
      setEventoNativo(null);
      setEStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", aoPrompt);
    window.addEventListener("appinstalled", aoInstalar);

    return () => {
      media.removeEventListener("change", aoMudarStandalone);
      window.removeEventListener("beforeinstallprompt", aoPrompt);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  const instalar = useCallback(async () => {
    if (eventoNativo) {
      await eventoNativo.prompt();
      await eventoNativo.userChoice;
      eventoGuardado = null;
      setEventoNativo(null);
      return;
    }
    if (eIos) {
      setSheetAberto(true);
    }
  }, [eventoNativo, eIos]);

  const dispensar = useCallback(() => {
    localStorage.setItem(CHAVE_DISPENSADO, "1");
    setDispensado(true);
  }, []);

  const fecharSheet = useCallback(() => setSheetAberto(false), []);

  const podePromptNativo = eventoNativo !== null;
  const podeInstalar =
    pronto && !eStandalone && (podePromptNativo || eIos);
  const mostrarCtaDismissable = podeInstalar && !dispensado;

  return {
    eStandalone,
    eIos,
    podePromptNativo,
    mostrarCtaLogin: mostrarCtaDismissable,
    mostrarBannerApp: mostrarCtaDismissable,
    mostrarItemPerfil: podeInstalar,
    sheetAberto,
    instalar,
    dispensar,
    fecharSheet,
  };
};
