"use client";

import type { CapturaFoto } from "../hooks/useCapturaFoto";
import { CameraStory } from "./CameraStory";

type Props = {
  captura: CapturaFoto;
};

export const EntradaFotoStory = ({ captura }: Props) => (
  <>
    <input
      ref={captura.inputGaleriaRef}
      hidden
      type="file"
      accept="image/jpeg,image/png"
      onChange={(evento) => {
        captura.receber(evento.target.files?.[0]);
        evento.target.value = "";
      }}
    />
    <input
      ref={captura.inputSistemaRef}
      hidden
      type="file"
      accept="image/jpeg,image/png"
      capture="environment"
      onChange={(evento) => {
        captura.receber(evento.target.files?.[0]);
        evento.target.value = "";
      }}
    />
    {captura.cameraAberta && captura.pedidoInicial ? (
      <CameraStory
        pedidoInicial={captura.pedidoInicial}
        preparando={captura.preparando}
        onFechar={captura.fecharCamera}
        onFoto={captura.receber}
        onGaleria={captura.abrirGaleria}
        onSistema={captura.abrirSistema}
      />
    ) : null}
  </>
);
