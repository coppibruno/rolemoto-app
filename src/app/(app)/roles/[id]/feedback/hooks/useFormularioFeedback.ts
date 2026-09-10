"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  FeedbackCreate,
  NotaFeedback,
  TagFeedback,
} from "@/types/usuario-role-feedback";
import { LIMITE_COMENTARIO } from "../constants";

export type NotaFormulario = 0 | NotaFeedback;

export const useFormularioFeedback = (enviando: boolean) => {
  const [nota, setNota] = useState<NotaFormulario>(0);
  const [tags, setTags] = useState<Set<TagFeedback>>(new Set());
  const [comentario, setComentario] = useState("");

  const toggleTag = useCallback((tag: TagFeedback) => {
    setTags((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(tag)) {
        proximo.delete(tag);
      } else {
        proximo.add(tag);
      }
      return proximo;
    });
  }, []);

  const alterarComentario = useCallback((valor: string) => {
    setComentario(valor.slice(0, LIMITE_COMENTARIO));
  }, []);

  const podeEnviar = nota >= 1 && !enviando;

  const payload = useMemo((): FeedbackCreate | null => {
    if (nota === 0) return null;
    return {
      nota,
      tags: [...tags],
      comentario: comentario.trim(),
    };
  }, [comentario, nota, tags]);

  return {
    nota,
    setNota,
    tags,
    toggleTag,
    comentario,
    alterarComentario,
    podeEnviar,
    payload,
  };
};
