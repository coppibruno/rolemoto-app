"use client";

import { useRef, useState } from "react";
import {
  cameraStoryDisponivel,
  capturarFotoStory,
  foiCancelamentoCaptura,
} from "@/lib/capturar-foto-story";
import { ERRO_FOTO_GRANDE, MAX_FOTO_BYTES, TIPOS_FOTO_ACEITOS } from "@/lib/storage";

export const useCapturaFoto = (aoFoto: (arquivo: File) => void) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  const aoArquivo = (arquivo: File | undefined) => {
    if (!arquivo) return;
    if (!TIPOS_FOTO_ACEITOS.includes(arquivo.type)) {
      setErro("Use uma foto JPEG ou PNG.");
      return;
    }
    if (arquivo.size > MAX_FOTO_BYTES) {
      setErro(ERRO_FOTO_GRANDE);
      return;
    }
    setErro(null);
    aoFoto(arquivo);
  };

  const abrir = () => {
    setErro(null);
    if (!cameraStoryDisponivel()) {
      inputRef.current?.click();
      return;
    }
    void (async () => {
      try {
        aoFoto(await capturarFotoStory());
      } catch (erroCaptura) {
        if (foiCancelamentoCaptura(erroCaptura)) return;
        setErro("Não foi possível abrir a câmera.");
      }
    })();
  };

  return { inputRef, erro, abrir, aoArquivo };
};
