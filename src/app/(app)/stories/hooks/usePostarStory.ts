"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import {
  cameraStoryDisponivel,
  capturarFotoStory,
  foiCancelamentoCaptura,
} from "@/lib/capturar-foto-story";
import {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
  uploadFotoStory,
} from "@/lib/storage";
import { destinoUpload, type AlvoPostagem, type StoryPublica } from "@/types/story-local";
import { storiesService } from "../services/stories.service";

const COPY_GPS = "Precisamos da localização na hora para postar a foto.";

const obterGps = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error("indisponivel"), { code: 2 }));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    });
  });

type Fase = "idle" | "gps" | "enviando";

export const usePostarStory = (
  alvo: AlvoPostagem,
  onCriada: (story: StoryPublica) => void,
) => {
  const { firebaseUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fase, setFase] = useState<Fase>("idle");
  const [erro, setErro] = useState<string | null>(null);

  const aoArquivo = async (file: File | undefined) => {
    if (!file || fase !== "idle") return;
    if (!TIPOS_FOTO_ACEITOS.includes(file.type)) {
      setErro("Use uma foto JPEG ou PNG.");
      return;
    }
    if (file.size > MAX_FOTO_BYTES) {
      setErro(ERRO_FOTO_GRANDE);
      return;
    }
    if (!firebaseUser) {
      setErro("Sessão expirada. Entre de novo para postar.");
      return;
    }

    setErro(null);
    setFase("gps");
    try {
      const pos = await obterGps();
      setFase("enviando");
      const destino = destinoUpload(alvo);
      const fotoUrl = await uploadFotoStory(
        destino.album,
        destino.id,
        firebaseUser.uid,
        file,
      );
      const story = await storiesService.postar(alvo, {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        fotoUrl,
      });
      onCriada(story);
    } catch (e) {
      const code = (e as GeolocationPositionError).code;
      if (code === 1) setErro(COPY_GPS);
      else if (code === 2 || code === 3) setErro("GPS impreciso. Tente ao ar livre.");
      else setErro(e instanceof ApiError ? e.message : "Não foi possível postar a foto.");
    } finally {
      setFase("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const abrir = () => {
    if (fase !== "idle") return;
    setErro(null);
    if (!cameraStoryDisponivel()) {
      inputRef.current?.click();
      return;
    }
    void (async () => {
      try {
        const file = await capturarFotoStory();
        await aoArquivo(file);
      } catch (e) {
        if (foiCancelamentoCaptura(e)) return;
        setErro("Não foi possível abrir a câmera.");
      }
    })();
  };

  const rotulo =
    fase === "gps" ? "Buscando localização…" : fase === "enviando" ? "Enviando foto…" : "Postar foto";

  return { inputRef, processando: fase !== "idle", erro, rotulo, abrir, aoArquivo };
};
