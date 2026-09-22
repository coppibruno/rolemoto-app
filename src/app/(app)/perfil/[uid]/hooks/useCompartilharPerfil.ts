"use client";

import { useCallback, useState } from "react";
import { compartilharConteudo } from "@/lib/compartilhar";
import {
  ERRO_SHARE,
  TOAST_LINK_COPIADO,
  tituloSharePerfil,
  textoSharePerfil,
} from "../constants";

const TOAST_MS = 2500;

export const useCompartilharPerfil = (uid: string, apelido: string) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const compartilhar = useCallback(async () => {
    const url = `${window.location.origin}/perfil/${uid}`;
    const resultado = await compartilharConteudo({
      title: tituloSharePerfil(apelido),
      text: textoSharePerfil(apelido),
      url,
    });
    if (resultado === "copiado") {
      setFeedback(TOAST_LINK_COPIADO);
      window.setTimeout(() => setFeedback(null), TOAST_MS);
      return;
    }
    if (resultado === "erro") {
      setFeedback(ERRO_SHARE);
      window.setTimeout(() => setFeedback(null), TOAST_MS);
    }
  }, [uid, apelido]);

  return { compartilhar, feedback };
};
