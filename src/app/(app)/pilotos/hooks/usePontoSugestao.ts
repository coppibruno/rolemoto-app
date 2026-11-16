"use client";

import { useEffect, useState } from "react";
import { STORAGE_PONTO } from "@/app/(app)/feed/constants";

export type PontoSugestao = { lat: number; lng: number };

const FLAG = "rolemoto.sugestoes.gpsPedido";

const lerSalvo = (): PontoSugestao | null => {
  if (typeof window === "undefined") return null;
  try {
    const bruto = sessionStorage.getItem(STORAGE_PONTO);
    if (!bruto) return null;
    const parsed = JSON.parse(bruto) as { lat?: unknown; lng?: unknown };
    if (typeof parsed.lat !== "number" || typeof parsed.lng !== "number") return null;
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
};

let pedido: Promise<PontoSugestao | null> | null = null;

const pedirUmaVez = (): Promise<PontoSugestao | null> => {
  const salvo = lerSalvo();
  if (salvo) return Promise.resolve(salvo);
  if (typeof window === "undefined") return Promise.resolve(null);
  if (sessionStorage.getItem(FLAG)) return Promise.resolve(null);
  if (!pedido) {
    sessionStorage.setItem(FLAG, "1");
    pedido = new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const ponto = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          sessionStorage.setItem(
            STORAGE_PONTO,
            JSON.stringify({
              ...ponto,
              label: "Sua localização",
              origem: "gps",
            }),
          );
          resolve(ponto);
        },
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    });
  }
  return pedido;
};

export const usePontoSugestao = () => {
  const [ponto, setPonto] = useState<PontoSugestao | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;
    void pedirUmaVez().then((resultado) => {
      if (!ativo) return;
      setPonto(resultado);
      setPronto(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  return { ponto, pronto };
};
