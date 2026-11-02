"use client";

import { useRef, useState } from "react";
import {
  cameraStoryDisponivel,
  capturarFotoStory,
  foiCancelamentoCaptura,
} from "@/lib/capturar-foto-story";
import { prepararFotoStory } from "@/lib/preparar-foto-story";
import { pedirCamera } from "./useCameraAoVivo";
import { ERRO_FOTO_GRANDE, MAX_FOTO_BYTES, TIPOS_FOTO_ACEITOS } from "@/lib/storage";

export const useCapturaFoto = (aoFoto: (arquivo: File) => void) => {
  const inputGaleriaRef = useRef<HTMLInputElement>(null);
  const inputSistemaRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [cameraAberta, setCameraAberta] = useState(false);
  const [pedidoInicial, setPedidoInicial] = useState<Promise<MediaStream> | null>(null);
  const [preparando, setPreparando] = useState(false);

  const receber = (arquivo: File | undefined) => {
    if (!arquivo) return;
    setPreparando(true);
    setErro(null);
    void (async () => {
      try {
        const pronta = await prepararFotoStory(arquivo);
        if (!TIPOS_FOTO_ACEITOS.includes(pronta.type)) {
          setCameraAberta(false);
          setErro("Use uma foto JPEG ou PNG.");
          return;
        }
        if (pronta.size > MAX_FOTO_BYTES) {
          setCameraAberta(false);
          setErro(ERRO_FOTO_GRANDE);
          return;
        }
        setCameraAberta(false);
        aoFoto(pronta);
      } catch {
        setCameraAberta(false);
        setErro("Não foi possível preparar a foto.");
      } finally {
        setPreparando(false);
      }
    })();
  };

  const abrirSistema = () => {
    setCameraAberta(false);
    if (!cameraStoryDisponivel()) {
      inputSistemaRef.current?.click();
      return;
    }
    void (async () => {
      try {
        receber(await capturarFotoStory());
      } catch (erroCaptura) {
        if (foiCancelamentoCaptura(erroCaptura)) return;
        setErro("Não foi possível abrir a câmera.");
      }
    })();
  };

  const abrir = () => {
    setErro(null);
    setPedidoInicial(pedirCamera(false));
    setCameraAberta(true);
  };

  return {
    inputGaleriaRef,
    inputSistemaRef,
    erro,
    cameraAberta,
    pedidoInicial,
    preparando,
    abrir,
    fecharCamera: () => setCameraAberta(false),
    receber,
    abrirGaleria: () => inputGaleriaRef.current?.click(),
    abrirSistema,
  };
};

export type CapturaFoto = ReturnType<typeof useCapturaFoto>;
