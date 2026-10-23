"use client";

import { useEffect, useState } from "react";
import { storiesService } from "@/app/(app)/stories/services/stories.service";

const cache = new Map<string, boolean>();
const ouvintes = new Map<string, Set<(tem: boolean) => void>>();

export const marcarTemStories = (uid: string, tem: boolean) => {
  cache.set(uid, tem);
  ouvintes.get(uid)?.forEach((ouvir) => ouvir(tem));
};

/** Verde só com a leitura. Falha do resumo não pinta o anel. */
export const recarregarTemStories = (uid: string) =>
  storiesService
    .resumo(uid)
    .then((dados) => marcarTemStories(uid, dados.storiesAtivas > 0))
    .catch(() => marcarTemStories(uid, false));

export const useTemStories = (uid: string) => {
  const [tem, setTem] = useState(cache.get(uid) ?? false);

  useEffect(() => {
    let cancelado = false;
    const ouvir = (valor: boolean) => {
      if (!cancelado) setTem(valor);
    };
    const lista = ouvintes.get(uid) ?? new Set();
    lista.add(ouvir);
    ouvintes.set(uid, lista);
    if (!cache.has(uid)) {
      storiesService
        .resumo(uid)
        .then((dados) => marcarTemStories(uid, dados.storiesAtivas > 0))
        .catch(() => undefined);
    } else {
      setTem(cache.get(uid) ?? false);
    }
    return () => {
      cancelado = true;
      lista.delete(ouvir);
    };
  }, [uid]);

  return tem;
};
