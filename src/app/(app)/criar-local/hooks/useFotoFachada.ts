"use client";

import { useEffect, useRef, useState } from "react";
import { uploadFotoFachadaLocal } from "@/lib/storage";
import {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
} from "../constants";

export const useFotoFachada = () => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [erro, setErro] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

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
      setErro("Use JPG ou PNG de até 10 MB");
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

  const remover = () => {
    setArquivo(null);
    setPreviewUrl("");
    setErro(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  const enviar = async (uid: string) => {
    if (!arquivo) return "";
    return uploadFotoFachadaLocal(uid, arquivo);
  };

  return {
    arquivo,
    previewUrl,
    erro,
    inputRef,
    aoSelecionarArquivo,
    abrirSeletor,
    remover,
    enviar,
  };
};
