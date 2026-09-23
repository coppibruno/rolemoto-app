"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { ouvirForeground } from "@/lib/fcm";
import { ouvirForegroundNativo } from "@/lib/fcm-nativo";

const TOAST_MS = 2500;

export const usePushForeground = () => {
  const [titulo, setTitulo] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    let unsubscribe: (() => void) | undefined;

    const mostrar = (title: string) => {
      if (ativo) {
        setTitulo(title);
      }
    };

    if (Capacitor.isNativePlatform()) {
      unsubscribe = ouvirForegroundNativo((payload) => mostrar(payload.title));
      return () => {
        ativo = false;
        unsubscribe?.();
      };
    }

    void ouvirForeground((payload) => mostrar(payload.title)).then((fn) => {
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
