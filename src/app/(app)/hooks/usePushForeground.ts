"use client";

import { useEffect, useState } from "react";
import { ouvirForeground } from "@/lib/fcm";

const TOAST_MS = 2500;

export const usePushForeground = () => {
  const [titulo, setTitulo] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    let unsubscribe: (() => void) | undefined;

    void ouvirForeground((payload) => {
      if (ativo) {
        setTitulo(payload.title);
      }
    }).then((fn) => {
      if (!ativo) {
        fn();
        return;
      }
      unsubscribe = fn;
    });

    return () => {
      ativo = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!titulo) {
      return;
    }
    const id = window.setTimeout(() => setTitulo(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [titulo]);

  return { titulo };
};
