"use client";

import { useCallback, useEffect, useState } from "react";
import { STORAGE_PONTO } from "../constants";
import { geocodeService } from "../services/geocode.service";
import type { PontoFeed, StatusLocalizacao } from "../types";

const lerPontoSalvo = (): PontoFeed | null => {
  if (typeof window === "undefined") return null;
  try {
    const bruto = sessionStorage.getItem(STORAGE_PONTO);
    if (!bruto) return null;
    const parsed = JSON.parse(bruto) as PontoFeed;
    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number" ||
      typeof parsed.label !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const salvarPonto = (ponto: PontoFeed) => {
  sessionStorage.setItem(STORAGE_PONTO, JSON.stringify(ponto));
};

const obterGps = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("indisponivel"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    });
  });

export const useLocalizacaoFeed = () => {
  const [ponto, setPonto] = useState<PontoFeed | null>(null);
  const [status, setStatus] = useState<StatusLocalizacao>("obtendo");
  const [seletorAberto, setSeletorAberto] = useState(false);

  const aplicarPonto = useCallback((novo: PontoFeed) => {
    setPonto(novo);
    setStatus("ok");
    salvarPonto(novo);
  }, []);

  const usarGps = useCallback(async () => {
    setStatus("obtendo");
    try {
      const pos = await obterGps();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const label = await geocodeService.reverso(lat, lng);
      aplicarPonto({ lat, lng, label, origem: "gps" });
    } catch (erro) {
      const code = (erro as GeolocationPositionError)?.code;
      setStatus(code === 1 ? "negado" : "indisponivel");
    }
  }, [aplicarPonto]);

  const escolherEndereco = useCallback(
    (lat: number, lng: number, label: string) => {
      aplicarPonto({ lat, lng, label, origem: "custom" });
      setSeletorAberto(false);
    },
    [aplicarPonto]
  );

  const abrirSeletor = useCallback(() => setSeletorAberto(true), []);
  const fecharSeletor = useCallback(() => setSeletorAberto(false), []);

  const usarGpsEFechar = useCallback(async () => {
    await usarGps();
    setSeletorAberto(false);
  }, [usarGps]);

  useEffect(() => {
    const salvo = lerPontoSalvo();
    if (salvo) {
      aplicarPonto(salvo);
      return;
    }
    void usarGps();
  }, [aplicarPonto, usarGps]);

  return {
    ponto,
    status,
    seletorAberto,
    abrirSeletor,
    fecharSeletor,
    usarGps: usarGpsEFechar,
    escolherEndereco,
  };
};
