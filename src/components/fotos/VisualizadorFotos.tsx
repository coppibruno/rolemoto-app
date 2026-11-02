"use client";

import { useEffect, useState } from "react";
import { DialogoFotos } from "./DialogoFotos";

type Props = {
  fotos: string[];
  indiceInicial: number;
  rotulo: string;
  onFechar: () => void;
};

export const VisualizadorFotos = ({ fotos, indiceInicial, rotulo, onFechar }: Props) => {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  if (!montado || fotos.length === 0) return null;

  return (
    <DialogoFotos
      fotos={fotos}
      indiceInicial={indiceInicial}
      rotulo={rotulo}
      onFechar={onFechar}
    />
  );
};
