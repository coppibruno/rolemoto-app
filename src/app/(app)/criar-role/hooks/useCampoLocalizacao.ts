"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Localizacao } from "@/types/role";
import { DEBOUNCE_BUSCA_MS, ENDERECO_MIN } from "../constants";
import { geocodeService, type SugestaoEndereco } from "../services/geocode.service";
import type { GpsStatus, LocalizacaoForm } from "../types";

const obterGps = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("indisponivel"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 0,
    });
  });

export const useCampoLocalizacao = () => {
  const [endereco, setEndereco] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [sugestoes, setSugestoes] = useState<SugestaoEndereco[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [erroGps, setErroGps] = useState<string | undefined>();
  const [listaAberta, setListaAberta] = useState(false);
  const escolhendoRef = useRef(false);

  useEffect(() => {
    if (escolhendoRef.current) {
      escolhendoRef.current = false;
      return;
    }

    if (lat != null && lng != null) {
      return;
    }

    if (endereco.trim().length < ENDERECO_MIN) {
      setSugestoes([]);
      setBuscando(false);
      return;
    }

    setBuscando(true);
    const id = window.setTimeout(async () => {
      const itens = await geocodeService.buscar(endereco);
      setSugestoes(itens);
      setBuscando(false);
    }, DEBOUNCE_BUSCA_MS);

    return () => window.clearTimeout(id);
  }, [endereco, lat, lng]);

  const aoDigitar = (texto: string) => {
    setEndereco(texto);
    setLat(null);
    setLng(null);
    setGpsStatus("idle");
    setErroGps(undefined);
    setListaAberta(true);
  };

  const escolher = (item: SugestaoEndereco) => {
    escolhendoRef.current = true;
    setEndereco(item.label);
    setLat(item.lat);
    setLng(item.lng);
    setSugestoes([]);
    setListaAberta(false);
    setGpsStatus("idle");
    setErroGps(undefined);
  };

  const preencher = useCallback((local: Localizacao) => {
    escolhendoRef.current = true;
    setEndereco(local.endereco);
    setLat(local.lat);
    setLng(local.lng);
    setSugestoes([]);
    setListaAberta(false);
    setGpsStatus("idle");
    setErroGps(undefined);
  }, []);

  const usarGps = async () => {
    setGpsStatus("buscando");
    setErroGps(undefined);
    setListaAberta(false);
    try {
      const pos = await obterGps();
      const novaLat = pos.coords.latitude;
      const novaLng = pos.coords.longitude;
      const label = await geocodeService.reverso(novaLat, novaLng);
      escolhendoRef.current = true;
      setEndereco(label);
      setLat(novaLat);
      setLng(novaLng);
      setSugestoes([]);
      setGpsStatus("fixado");
    } catch {
      setGpsStatus("erro");
      setErroGps("Autorize a localização ou busque o endereço");
    }
  };

  const valor: LocalizacaoForm = { endereco, lat, lng };

  return {
    valor,
    sugestoes,
    buscando,
    gpsStatus,
    erroGps,
    listaAberta,
    aoDigitar,
    escolher,
    preencher,
    fecharLista: () => setListaAberta(false),
    usarGps,
  };
};
