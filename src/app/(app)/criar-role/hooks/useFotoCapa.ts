"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadFotoCapaRole } from "@/lib/storage";
import { ERRO_FOTO_GRANDE, MAX_FOTO_BYTES, TIPOS_FOTO_ACEITOS } from "../constants";

export const useFotoCapa = () => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [urlHerdada, setUrlHerdada] = useState(false);
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
    setUrlHerdada(false);
    setArquivo(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const abrirSeletor = () => {
    inputRef.current?.click();
  };

  const remover = () => {
    setArquivo(null);
    setPreviewUrl("");
    setUrlHerdada(false);
    setErro(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  const usarUrlExistente = useCallback((url: string) => {
    const limpa = url.trim();
    setArquivo(null);
    setPreviewUrl(limpa);
    setUrlHerdada(Boolean(limpa));
    setErro(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const enviar = (uid: string) => {
    if (arquivo) {
      return uploadFotoCapaRole(uid, arquivo);
    }
    if (urlHerdada && previewUrl) {
      return Promise.resolve(previewUrl);
    }
    return Promise.reject(new Error("Inclua a foto de capa do rolê"));
  };

  return {
    arquivo,
    previewUrl,
    urlHerdada,
    erro,
    inputRef,
    aoSelecionarArquivo,
    abrirSeletor,
    remover,
    usarUrlExistente,
    enviar,
  };
};
