"use client";

import { useEffect, useState } from "react";
import type { Coord } from "@/lib/mapa-viagem/viagem";

/** Posição contínua pelo GPS. `negado` cobre permissão recusada e aparelho sem GPS. */
export const usePosicaoViagem = () => {
  const [posicao, setPosicao] = useState<Coord | null>(null);
  const [negado, setNegado] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setNegado(true);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setNegado(false);
        setPosicao({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (erro) => {
        if (erro.code === erro.PERMISSION_DENIED || erro.code === erro.POSITION_UNAVAILABLE) {
          setNegado(true);
        }
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { posicao, negado };
};
