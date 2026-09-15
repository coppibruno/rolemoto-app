"use client";

import { useEffect, useRef, useState } from "react";
import { uploadFotoPerfil } from "@/lib/storage";
import { ERRO_FOTO_GRANDE, MAX_FOTO_BYTES, TIPOS_FOTO_ACEITOS } from "../constants";

export const useFotoPerfil = (fotoUrlInicial: string) => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(fotoUrlInicial);
  const [erro, setErro] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (arquivo) return;
    setPreviewUrl(fotoUrlInicial);
  }, [arquivo, fotoUrlInicial]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const aoSelecionarArquivo = (file: File | undefined) => {
    if (!file) return;

    if (!TIPOS_FOTO_ACEITOS.includes(file.type)) {
      setErro("Formato inválido. Use JPG ou PNG.");
      return;
    }

    if (file.size > MAX_FOTO_BYTES) {
      setErro(ERRO_FOTO_GRANDE);
      return;
    }

    setErro(undefined);
    setArquivo(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const abrirSeletor = () => {
    inputRef.current?.click();
  };

  const enviar = (uid: string, fotoUrlAtual: string) => {
    if (!arquivo) {
      return Promise.resolve(fotoUrlAtual);
    }
    return uploadFotoPerfil(uid, arquivo);
  };

  const limparArquivo = () => setArquivo(null);

  return {
    arquivo,
    previewUrl,
    erro,
    inputRef,
    aoSelecionarArquivo,
    abrirSeletor,
    enviar,
    limparArquivo,
  };
};
