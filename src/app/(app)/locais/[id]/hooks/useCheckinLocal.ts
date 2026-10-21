"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { LocalDetalhe } from "@/types/local";
import {
  CHECKIN_ERRO,
  CHECKIN_IMPRECISO,
  CHECKIN_LONGE,
  CHECKIN_PERMISSAO,
  PRECISAO_MAX_CHECKIN_M,
  RAIO_CHECKIN_M,
} from "../constants";
import { localDetalheService } from "../services/local-detalhe.service";

const RAIO_TERRA_KM = 6371;

const haversineM = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const toRad = (graus: number) => (graus * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(a)) * 1000;
};

const obterGps = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error("indisponivel"), { code: 2 }));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });

type Props = {
  local: LocalDetalhe;
};

export const useCheckinLocal = ({ local }: Props) => {
  const { recarregarPerfil } = useAuth();
  const [checkinProprio, setCheckinProprio] = useState(local.checkinProprio);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [seloNovo, setSeloNovo] = useState<string | null>(null);

  useEffect(() => {
    setCheckinProprio(local.checkinProprio);
    setErro(null);
    setSeloNovo(null);
  }, [local.id, local.checkinProprio]);

  const marcar = useCallback(async () => {
    if (processando || checkinProprio) return;
    setProcessando(true);
    setErro(null);
    try {
      const pos = await obterGps();
      const { latitude, longitude, accuracy } = pos.coords;
      if (!Number.isFinite(accuracy) || accuracy > PRECISAO_MAX_CHECKIN_M) {
        setErro(CHECKIN_IMPRECISO);
        return;
      }
      const distanciaM = haversineM(
        latitude,
        longitude,
        local.lat,
        local.lng,
      );
      if (distanciaM > RAIO_CHECKIN_M) {
        setErro(CHECKIN_LONGE);
        return;
      }
      const resposta = await localDetalheService.checkin(
        local.id,
        latitude,
        longitude,
        accuracy,
      );
      setCheckinProprio(true);
      setSeloNovo(resposta.seloNovo?.label ?? null);
      void recarregarPerfil();
    } catch (e) {
      const code = (e as GeolocationPositionError)?.code;
      if (code === 1) {
        setErro(CHECKIN_PERMISSAO);
        return;
      }
      if (code === 2 || code === 3) {
        setErro(CHECKIN_IMPRECISO);
        return;
      }
      setErro(e instanceof ApiError ? e.message : CHECKIN_ERRO);
    } finally {
      setProcessando(false);
    }
  }, [checkinProprio, local.id, local.lat, local.lng, processando, recarregarPerfil]);

  return { checkinProprio, processando, erro, seloNovo, marcar };
};
