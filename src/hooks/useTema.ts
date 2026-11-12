"use client";

import { useContext } from "react";
import { TemaContext } from "@/components/providers/TemaProvider";

export const useTema = () => {
  const contexto = useContext(TemaContext);
  if (!contexto) {
    throw new Error("useTema precisa estar dentro de TemaProvider");
  }
  return contexto;
};
