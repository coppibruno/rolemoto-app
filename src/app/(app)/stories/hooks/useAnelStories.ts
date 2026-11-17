"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePlayerDetalhe } from "./usePlayerDetalhe";
import { useTemStories } from "./useTemStories";
import { useCapturaFoto } from "./useCapturaFoto";
import type { StoryPublica } from "@/types/story-local";

export const useAnelStories = (uid: string, nome: string) => {
  const router = useRouter();
  const { usuario } = useAuth();
  const proprio = usuario?.uid === uid;
  const tem = useTemStories(uid);
  const [menu, setMenu] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const player = usePlayerDetalhe(tem);
  const captura = useCapturaFoto(setArquivo);
  const href = proprio ? "/perfil" : `/perfil/${uid}`;

  useEffect(() => {
    if (!menu) return;
    const fechar = () => setMenu(false);
    window.addEventListener("pointerdown", fechar);
    return () => window.removeEventListener("pointerdown", fechar);
  }, [menu]);

  const abrir = () => {
    if (proprio && !tem) {
      router.push(href);
      return;
    }
    if (!proprio && !tem) {
      router.push(href);
      return;
    }
    if (proprio && tem) {
      player.abrir(null);
      return;
    }
    setMenu((atual) => !atual);
  };

  const verFotos = () => {
    setMenu(false);
    player.abrir(null);
  };

  const verPerfil = () => {
    setMenu(false);
    router.push(href);
  };

  const publicada = (story: StoryPublica) => {
    setArquivo(null);
    player.abrir(story.id, story);
  };

  const opcoes = proprio
    ? [{ rotulo: "Ver fotos", aoClicar: verFotos }]
    : [
      { rotulo: "Visualizar perfil", aoClicar: verPerfil },
      { rotulo: "Visualizar Stories", aoClicar: verFotos },
    ];

  const rotulo = tem
    ? `Stories de ${nome}`
    : proprio
      ? "Seu perfil"
      : `Perfil de ${nome}`;

  return {
    tem,
    menu,
    abrir,
    opcoes,
    player,
    arquivo,
    descartar: () => setArquivo(null),
    publicada,
    captura,
    erro: captura.erro,
    rotulo,
  };
};
