"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, api } from "@/lib/api";
import {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
  uploadFotoStory,
} from "@/lib/storage";
import { destinoUpload } from "@/types/story-local";
import { recarregarTemStories } from "@/app/(app)/stories/hooks/useTemStories";
import { storiesService } from "../services/stories.service";
import { presencaService } from "@/app/(app)/perfil/services/presenca.service";

export type MencaoOpcao = {
  tipo: "local" | "evento";
  id: string;
  nome: string;
  localId: string | null;
};

const COPY_GPS = "Precisamos da localização na hora para marcar esse lugar.";

const obterGps = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error("gps"), { code: 2 }));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    });
  });

const mensagem = (e: unknown): string => {
  const code = (e as GeolocationPositionError).code;
  if (code === 1) return COPY_GPS;
  if (code === 2 || code === 3) return "GPS impreciso. Tente ao ar livre.";
  return e instanceof ApiError ? e.message : "Não foi possível postar a foto.";
};

export const useMencoesStory = (aberto: boolean) => {
  const [opcoes, setOpcoes] = useState<MencaoOpcao[]>([]);
  const [perto, setPerto] = useState<MencaoOpcao | null>(null);

  useEffect(() => {
    if (!aberto) return;
    let cancelado = false;
    Promise.all([
      api<Array<{ id: string; nome: string }>>("/locais"),
      api<Array<{ id: string; titulo: string; localId: string | null }>>("/eventos"),
    ])
      .then(([locais, eventos]) => {
        if (cancelado) return;
        setOpcoes([
          ...locais.map((local) => ({
            tipo: "local" as const,
            id: local.id,
            nome: local.nome,
            localId: local.id,
          })),
          ...eventos.map((evento) => ({
            tipo: "evento" as const,
            id: evento.id,
            nome: evento.titulo,
            localId: evento.localId,
          })),
        ]);
      })
      .catch(() => undefined);

    navigator.geolocation?.getCurrentPosition((pos) => {
      presencaService
        .proximo(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy)
        .then((dados) => {
          if (cancelado || !dados.ponto) return;
          const ponto = dados.ponto;
          setPerto(
            ponto.tipo === "local"
              ? { tipo: "local", id: ponto.id, nome: ponto.nome, localId: ponto.id }
              : {
                tipo: "evento",
                id: ponto.id,
                nome: ponto.nome,
                localId: ponto.localId,
              },
          );
        })
        .catch(() => undefined);
    });

    return () => {
      cancelado = true;
    };
  }, [aberto]);

  return { opcoes, perto };
};

export const usePublicarStoryPerfil = () => {
  const { firebaseUser } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const publicar = useCallback(async (file: File, mencao: MencaoOpcao | null) => {
    if (!firebaseUser) {
      setErro("Sessão expirada. Entre de novo para postar.");
      return null;
    }
    if (!TIPOS_FOTO_ACEITOS.includes(file.type)) {
      setErro("Use uma foto JPEG ou PNG.");
      return null;
    }
    if (file.size > MAX_FOTO_BYTES) {
      setErro(ERRO_FOTO_GRANDE);
      return null;
    }
    setEnviando(true);
    setErro(null);
    try {
      const fotoUrl = mencao
        ? await uploadFotoStory(
          destinoUpload(
            mencao.tipo === "local"
              ? { tipo: "local", id: mencao.id }
              : { tipo: "evento", id: mencao.id, localId: mencao.localId },
          ).album,
          destinoUpload(
            mencao.tipo === "local"
              ? { tipo: "local", id: mencao.id }
              : { tipo: "evento", id: mencao.id, localId: mencao.localId },
          ).id,
          firebaseUser.uid,
          file,
        )
        : await uploadFotoStory("perfil", firebaseUser.uid, firebaseUser.uid, file);

      const gps = mencao ? await obterGps() : null;
      const story = await storiesService.postarNoPerfil({
        fotoUrl,
        ...(mencao?.tipo === "local" ? { localId: mencao.id } : {}),
        ...(mencao?.tipo === "evento" ? { eventoId: mencao.id } : {}),
        ...(gps
          ? {
            lat: gps.coords.latitude,
            lng: gps.coords.longitude,
            accuracy: gps.coords.accuracy,
          }
          : {}),
      });
      void recarregarTemStories(firebaseUser.uid);
      return story;
    } catch (e) {
      setErro(mensagem(e));
      return null;
    } finally {
      setEnviando(false);
    }
  }, [firebaseUser]);

  return { publicar, enviando, erro, setErro };
};
