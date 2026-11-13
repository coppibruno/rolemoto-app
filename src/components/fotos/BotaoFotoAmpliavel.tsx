"use client";

import { useState } from "react";
import { VisualizadorFotos } from "./VisualizadorFotos";

type Props = {
  src: string;
  rotulo: string;
  className: string;
  imgClassName: string;
};

export const BotaoFotoAmpliavel = ({ src, rotulo, className, imgClassName }: Props) => {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={`Ver foto de ${rotulo} inteira`}
        onClick={() => setAberta(true)}
      >
        <img src={src} alt="" className={imgClassName} />
      </button>
      {aberta ? (
        <VisualizadorFotos
          fotos={[src]}
          indiceInicial={0}
          rotulo={`Foto de ${rotulo}`}
          onFechar={() => setAberta(false)}
        />
      ) : null}
    </>
  );
};
