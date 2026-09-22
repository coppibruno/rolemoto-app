"use client";

import { useCallback, useRef, useState } from "react";
import {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
  uploadFotoAvaliacao,
} from "@/lib/storage";
import type { TipoAlvoAvaliacao } from "@/types/avaliacao-experiencia";
import { LIMITE_FOTOS } from "../constants";

export type FotoPendente = {
  id: string;
  file: File;
  previewUrl: string;
};

export const useFotosVisita = () => {
  const [fotos, setFotos] = useState<FotoPendente[]>([]);
  const [urlsRemotas, setUrlsRemotas] = useState<string[]>([]);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalFotos = fotos.length + urlsRemotas.length;

  const liberarPreview = useCallback((url: string) => {
    URL.revokeObjectURL(url);
  }, []);

  const definirRemotas = useCallback((urls: string[]) => {
    setUrlsRemotas(urls.filter(Boolean).slice(0, LIMITE_FOTOS));
  }, []);

  const anexar = useCallback(
    (lista: FileList | null) => {
      if (!lista || lista.length === 0) return;
      setErroFoto(null);

      setFotos((atual) => {
        const vagas = LIMITE_FOTOS - urlsRemotas.length - atual.length;
        if (vagas <= 0) return atual;

        const proximas: FotoPendente[] = [];
        for (const file of Array.from(lista)) {
          if (proximas.length >= vagas) break;
          if (!TIPOS_FOTO_ACEITOS.includes(file.type)) {
            setErroFoto("Use JPG ou PNG.");
            continue;
          }
          if (file.size > MAX_FOTO_BYTES) {
            setErroFoto(ERRO_FOTO_GRANDE);
            continue;
          }
          proximas.push({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
          });
        }
        return [...atual, ...proximas];
      });
    },
    [urlsRemotas.length],
  );

  const remover = useCallback(
    (id: string) => {
      setFotos((atual) => {
        const alvo = atual.find((item) => item.id === id);
        if (alvo) liberarPreview(alvo.previewUrl);
        return atual.filter((item) => item.id !== id);
      });
    },
    [liberarPreview],
  );

  const removerRemota = useCallback((url: string) => {
    setUrlsRemotas((atual) => atual.filter((item) => item !== url));
  }, []);

  const abrirSeletor = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const uploadTodas = useCallback(
    async (
      uid: string,
      tipo: TipoAlvoAvaliacao,
      alvoId: string,
    ): Promise<string[]> => {
      if (fotos.length === 0) return [...urlsRemotas];
      setEnviandoFotos(true);
      try {
        const urls: string[] = [...urlsRemotas];
        for (const foto of fotos) {
          const url = await uploadFotoAvaliacao(uid, tipo, alvoId, foto.file);
          urls.push(url);
        }
        return urls.slice(0, LIMITE_FOTOS);
      } finally {
        setEnviandoFotos(false);
      }
    },
    [fotos, urlsRemotas],
  );

  const limpar = useCallback(() => {
    setFotos((atual) => {
      for (const foto of atual) liberarPreview(foto.previewUrl);
      return [];
    });
    setUrlsRemotas([]);
  }, [liberarPreview]);

  return {
    fotos,
    urlsRemotas,
    definirRemotas,
    erroFoto,
    enviandoFotos,
    inputRef,
    anexar,
    remover,
    removerRemota,
    abrirSeletor,
    uploadTodas,
    limpar,
    podeAnexar: totalFotos < LIMITE_FOTOS,
  };
};
