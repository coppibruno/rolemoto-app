"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ESPERA_SOLTA_MS = 280;
const ESPERA_RETRY_MS = 420;

const soltar = (fluxo: MediaStream | null) => {
  fluxo?.getTracks().forEach((faixa) => faixa.stop());
};

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const midiaPronta = (): boolean =>
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === "function";

export const pedirCamera = (frente: boolean, deviceId?: string): Promise<MediaStream> => {
  if (!midiaPronta()) return Promise.reject(new Error("sem camera"));
  const video: MediaTrackConstraints = deviceId
    ? { deviceId: { exact: deviceId } }
    : { facingMode: { ideal: frente ? "user" : "environment" } };
  return navigator.mediaDevices.getUserMedia({ audio: false, video });
};

const listarVideos = async (): Promise<MediaDeviceInfo[]> => {
  try {
    const lista = await navigator.mediaDevices.enumerateDevices();
    return lista.filter((item) => item.kind === "videoinput" && item.deviceId);
  } catch {
    return [];
  }
};

const deviceDaOutraFace = (
  videos: MediaDeviceInfo[],
  atual: string | undefined,
  frente: boolean,
): string | undefined => {
  const outros = videos.filter((item) => item.deviceId !== atual);
  if (outros.length === 0) return undefined;
  const texto = frente ? /front|user|face|frontal|selfie/i : /back|rear|environment|traseir/i;
  return outros.find((item) => texto.test(item.label))?.deviceId ?? outros[0]?.deviceId;
};

const prepararVideo = (video: HTMLVideoElement, stream: MediaStream) => {
  video.srcObject = stream;
  video.muted = true;
  video.defaultMuted = true;
  video.controls = false;
  video.playsInline = true;
  video.disablePictureInPicture = true;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
};

const tocar = async (video: HTMLVideoElement): Promise<boolean> => {
  try {
    await video.play();
    return true;
  } catch {
    await esperar(160);
    try {
      await video.play();
      return true;
    } catch {
      return false;
    }
  }
};

export const useCameraAoVivo = (pedidoInicial: Promise<MediaStream>) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fluxoRef = useRef<MediaStream | null>(null);
  const geracao = useRef(0);
  const frenteRef = useRef(false);
  const [pronto, setPronto] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [frente, setFrente] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const exibir = useCallback(async (
    stream: MediaStream,
    usarFrente: boolean,
    minha: number,
  ): Promise<boolean> => {
    if (geracao.current !== minha) {
      soltar(stream);
      return false;
    }
    const video = videoRef.current;
    if (!video) {
      soltar(stream);
      return false;
    }
    fluxoRef.current = stream;
    prepararVideo(video, stream);
    const tocou = await tocar(video);
    if (geracao.current !== minha) {
      soltar(stream);
      if (fluxoRef.current === stream) fluxoRef.current = null;
      return false;
    }
    if (!tocou) {
      soltar(stream);
      if (fluxoRef.current === stream) fluxoRef.current = null;
      if (video.srcObject === stream) video.srcObject = null;
      return false;
    }
    frenteRef.current = usarFrente;
    setFrente(usarFrente);
    setPronto(true);
    setFalhou(false);
    return true;
  }, []);

  const exibirRef = useRef(exibir);
  exibirRef.current = exibir;

  useEffect(() => {
    const minha = ++geracao.current;
    setPronto(false);
    setFalhou(false);
    setAviso(null);
    pedidoInicial
      .then(async (stream) => {
        if (geracao.current !== minha) {
          soltar(stream);
          return;
        }
        const ok = await exibirRef.current(stream, false, minha);
        if (geracao.current === minha && !ok) setFalhou(true);
      })
      .catch(() => {
        if (geracao.current === minha) setFalhou(true);
      });
    return () => {
      geracao.current += 1;
      soltar(fluxoRef.current);
      fluxoRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [pedidoInicial]);

  const abrirDiferente = async (
    frenteAlvo: boolean,
    deviceId: string | undefined,
    deviceAtual: string | undefined,
    minha: number,
  ): Promise<boolean> => {
    if (geracao.current !== minha) return false;
    let stream: MediaStream;
    try {
      stream = await pedirCamera(frenteAlvo, deviceId);
    } catch {
      return false;
    }
    if (geracao.current !== minha) {
      soltar(stream);
      return false;
    }
    const ajustes = stream.getVideoTracks()[0]?.getSettings();
    const face = ajustes?.facingMode;
    const esperada = frenteAlvo ? "user" : "environment";
    const mesma = Boolean(deviceAtual && ajustes?.deviceId && ajustes.deviceId === deviceAtual);
    const faceErrada = Boolean(face && face !== esperada);
    const naoTrocou = Boolean(deviceId) && mesma;
    if (faceErrada || naoTrocou) {
      soltar(stream);
      return false;
    }
    return exibir(stream, frenteAlvo, minha);
  };

  const reabrir = async (
    frenteAlvo: boolean,
    deviceId: string | undefined,
    minha: number,
  ): Promise<boolean> => {
    try {
      const stream = await pedirCamera(frenteAlvo, deviceId);
      if (geracao.current !== minha) {
        soltar(stream);
        return false;
      }
      return exibir(stream, frenteAlvo, minha);
    } catch {
      if (!deviceId || geracao.current !== minha) return false;
      try {
        const stream = await pedirCamera(frenteAlvo);
        if (geracao.current !== minha) {
          soltar(stream);
          return false;
        }
        return exibir(stream, frenteAlvo, minha);
      } catch {
        return false;
      }
    }
  };

  const virar = () => {
    const atual = fluxoRef.current;
    if (!atual) return;
    const minha = ++geracao.current;
    const estavaFrente = frenteRef.current;
    const deviceAtual = atual.getVideoTracks()[0]?.getSettings().deviceId;
    // O Android não abre a outra câmera enquanto a atual segue ligada.
    soltar(atual);
    fluxoRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setPronto(false);
    setAviso(null);

    void (async () => {
      await esperar(ESPERA_SOLTA_MS);
      if (geracao.current !== minha) return;
      const videos = await listarVideos();
      if (geracao.current !== minha) return;
      const destino = !estavaFrente;
      const outroId = deviceDaOutraFace(videos, deviceAtual, destino);
      if (await abrirDiferente(destino, outroId, deviceAtual, minha)) return;
      if (geracao.current !== minha) return;
      await esperar(ESPERA_RETRY_MS);
      if (geracao.current !== minha) return;
      if (await abrirDiferente(destino, outroId, deviceAtual, minha)) return;
      if (outroId && geracao.current === minha) {
        if (await abrirDiferente(destino, undefined, deviceAtual, minha)) return;
      }
      if (geracao.current !== minha) return;
      const voltou = await reabrir(estavaFrente, deviceAtual, minha);
      if (geracao.current !== minha) return;
      if (voltou) {
        setAviso("Não foi possível virar a câmera.");
        return;
      }
      setFalhou(true);
    })();
  };

  return { videoRef, pronto, falhou, frente, aviso, virar };
};
