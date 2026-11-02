"use client";

import { useCallback, useRef, useState } from "react";
import { uploadFotoAvaliacao } from "@/lib/storage";
import type { TipoAlvoAvaliacao } from "@/types/avaliacao-experiencia";
import { ERRO_FOTO_ENVIO, LIMITE_FOTOS } from "../constants";
import {
  contentTypeFotoAvaliacao,
  selecionarArquivosFoto,
} from "../fotos-visita";

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
    (arquivos: readonly File[]) => {
      if (arquivos.length === 0) return;

      const vagas = LIMITE_FOTOS - urlsRemotas.length - fotos.length;
      const { aceitos, erro } = selecionarArquivosFoto(arquivos, vagas);
      setErroFoto(erro);
      if (aceitos.length === 0) return;

      const proximas: FotoPendente[] = aceitos.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setFotos((atual) => {
        const cabem = LIMITE_FOTOS - urlsRemotas.length - atual.length;
        if (cabem <= 0) {
          proximas.forEach((foto) => liberarPreview(foto.previewUrl));
          return atual;
        }
        if (proximas.length > cabem) {
          proximas
            .slice(cabem)
            .forEach((foto) => liberarPreview(foto.previewUrl));
        }
        return [...atual, ...proximas.slice(0, cabem)];
      });
    },
    [fotos.length, liberarPreview, urlsRemotas.length],
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
          const url = await uploadFotoAvaliacao(
            uid,
            tipo,
            alvoId,
            foto.file,
            contentTypeFotoAvaliacao(foto.file),
          );
          urls.push(url);
        }
        return urls.slice(0, LIMITE_FOTOS);
      } catch (falha) {
        setErroFoto(ERRO_FOTO_ENVIO);
        throw falha;
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

  const descartarPendentes = useCallback(() => {
    setFotos((atual) => {
      for (const foto of atual) liberarPreview(foto.previewUrl);
      return [];
    });
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
    descartarPendentes,
    podeAnexar: totalFotos < LIMITE_FOTOS,
  };
};
