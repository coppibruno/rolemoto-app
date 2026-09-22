"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AvaliacaoCreate,
  AvaliacaoExperiencia,
  NotaAvaliacao,
} from "@/types/avaliacao-experiencia";
import { LIMITE_COMENTARIO } from "../constants";

export type NotaFormulario = 0 | NotaAvaliacao;

export const useFormularioAvaliacao = (
  enviando: boolean,
  existente?: AvaliacaoExperiencia | null,
) => {
  const [nota, setNota] = useState<NotaFormulario>(0);
  const [comentario, setComentario] = useState("");
  const [recomendaComboio, setRecomendaComboio] = useState(false);

  useEffect(() => {
    if (!existente) return;
    setNota(existente.nota as NotaFormulario);
    setComentario(existente.comentario);
    setRecomendaComboio(existente.recomendaComboio);
  }, [existente]);

  const alterarComentario = useCallback((valor: string) => {
    setComentario(valor.slice(0, LIMITE_COMENTARIO));
  }, []);

  const podeEnviarBase = nota >= 1 && !enviando;

  const payloadBase = useMemo((): Omit<AvaliacaoCreate, "fotosUrls"> | null => {
    if (nota === 0) return null;
    return {
      nota,
      comentario: comentario.trim(),
      recomendaComboio,
    };
  }, [comentario, nota, recomendaComboio]);

  return {
    nota,
    setNota,
    comentario,
    alterarComentario,
    recomendaComboio,
    setRecomendaComboio,
    podeEnviarBase,
    payloadBase,
    modoEdicao: Boolean(existente),
  };
};
