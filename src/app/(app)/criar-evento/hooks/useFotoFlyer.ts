"use client";

import { useEffect, useRef, useState } from "react";
import { uploadFotoCapaEvento } from "@/lib/storage";
import {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
} from "../constants";

export const useFotoFlyer = () => {
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

  const remover = () => {
    setArquivo(null);
    setPreviewUrl("");
    setErro(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  const enviar = (uid: string) => {
    if (arquivo) {
      return uploadFotoCapaEvento(uid, arquivo);
    }
    return Promise.reject(new Error("Inclua o flyer ou a foto de capa"));
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
