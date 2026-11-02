"use client";

import { useEffect, useRef, useState } from "react";
import { LIMITE_FOTOS_LOCAL, selecionarFotosLocal } from "@/lib/fotos-local";
import { uploadFotoFachadaLocal } from "@/lib/storage";

export type FotoPendente = {
  id: string;
  arquivo: File;
  previewUrl: string;
};

export const useFotosFachada = () => {
  const [fotos, setFotos] = useState<FotoPendente[]>([]);
  const [erro, setErro] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;

  useEffect(() => {
    return () => {
      for (const foto of fotosRef.current) {
        URL.revokeObjectURL(foto.previewUrl);
      }
    };
  }, []);

  const abrirSeletor = () => {
    inputRef.current?.click();
  };

  const adicionar = (arquivos: readonly File[]) => {
    if (arquivos.length === 0) return;
    const { aceitas, erro: aviso } = selecionarFotosLocal(
      arquivos,
      fotosRef.current.length,
    );
    if (aceitas.length > 0) {
      setFotos((atual) => [
        ...atual,
        ...aceitas.map((arquivo) => ({
          id: crypto.randomUUID(),
          arquivo,
          previewUrl: URL.createObjectURL(arquivo),
        })),
      ]);
    }
    setErro(aviso);
  };

  const remover = (id: string) => {
    setFotos((atual) => {
      const alvo = atual.find((foto) => foto.id === id);
      if (alvo) URL.revokeObjectURL(alvo.previewUrl);
      return atual.filter((foto) => foto.id !== id);
    });
    setErro(undefined);
  };

  const enviar = async (uid: string) =>
    Promise.all(
      fotosRef.current.map((foto) => uploadFotoFachadaLocal(uid, foto.arquivo)),
    );

  return {
    fotos,
    erro,
    inputRef,
    podeAnexar: fotos.length < LIMITE_FOTOS_LOCAL,
    adicionar,
    abrirSeletor,
    remover,
    enviar,
  };
};
