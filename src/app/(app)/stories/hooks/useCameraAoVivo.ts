"use client";

import { useEffect, useRef, useState } from "react";

const soltar = (fluxo: MediaStream | null) => {
  fluxo?.getTracks().forEach((faixa) => faixa.stop());
};

export const pedirCamera = (frente: boolean): Promise<MediaStream> => {
  const midia = navigator.mediaDevices;
  if (!midia || typeof midia.getUserMedia !== "function") {
    return Promise.reject(new Error("sem camera"));
  }
  return midia.getUserMedia({
    audio: false,
    video: { facingMode: frente ? "user" : { ideal: "environment" } },
  });
};

export const useCameraAoVivo = (pedidoInicial: Promise<MediaStream>) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fluxoRef = useRef<MediaStream | null>(null);
  const donoRef = useRef<Promise<MediaStream> | null>(null);
  const geracao = useRef(0);
  const [pronto, setPronto] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [frente, setFrente] = useState(false);

  const aplicar = (pedido: Promise<MediaStream>, usarFrente: boolean) => {
    const minha = ++geracao.current;
    donoRef.current = pedido;
    setFrente(usarFrente);
    setPronto(false);
    setFalhou(false);
    soltar(fluxoRef.current);
    fluxoRef.current = null;

    pedido
      .then(async (stream) => {
        if (geracao.current !== minha) {
          if (donoRef.current !== pedido) soltar(stream);
          return;
        }
        const video = videoRef.current;
        if (!video) {
          soltar(stream);
          setFalhou(true);
          return;
        }
        fluxoRef.current = stream;
        video.srcObject = stream;
        video.muted = true;
        video.setAttribute("playsinline", "true");
        await video.play();
        if (geracao.current === minha) setPronto(true);
      })
      .catch(() => {
        if (geracao.current !== minha) return;
        soltar(fluxoRef.current);
        fluxoRef.current = null;
        setFalhou(true);
      });
  };

  const aplicarRef = useRef(aplicar);
  aplicarRef.current = aplicar;

  useEffect(() => {
    aplicarRef.current(pedidoInicial, false);
    return () => {
      geracao.current += 1;
      donoRef.current = null;
      soltar(fluxoRef.current);
      fluxoRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [pedidoInicial]);

  const virar = () => {
    aplicar(pedirCamera(!frente), !frente);
  };

  return { videoRef, pronto, falhou, frente, virar };
};
