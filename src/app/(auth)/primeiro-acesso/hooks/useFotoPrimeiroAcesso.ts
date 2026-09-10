"use client";

import { useEffect, useRef, useState } from "react";
import { uploadFotoPerfil } from "@/lib/storage";
import { MAX_FOTO_BYTES, TIPOS_FOTO_ACEITOS } from "../constants";

export const useFotoPrimeiroAcesso = (fotoUrlInicial: string) => {
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
      setErro("A foto deve ter no máximo 2MB.");
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

  return {
    arquivo,
    previewUrl,
    erro,
    inputRef,
    aoSelecionarArquivo,
    abrirSeletor,
    enviar,
  };
};
