"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ERRO_FORA_DO_SUL, pontoEstaNoSul } from "@/lib/regiao-sul";
import type { Localizacao } from "@/types/role";
import { DEBOUNCE_BUSCA_MS, DEBOUNCE_REVERSO_MAPA_MS, ENDERECO_MIN } from "../constants";
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
  const [nome, setNome] = useState("");
  const [sugestoes, setSugestoes] = useState<SugestaoEndereco[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [resolvendoEndereco, setResolvendoEndereco] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [erroGps, setErroGps] = useState<string | undefined>();
  const [listaAberta, setListaAberta] = useState(false);
  const [vooId, setVooId] = useState(0);
  const escolhendoRef = useRef(false);
  const reversoTimerRef = useRef<number | null>(null);
  const reversoSeqRef = useRef(0);
  const enderecoRef = useRef("");
  const latRef = useRef<number | null>(null);
  const lngRef = useRef<number | null>(null);
  const pendenteMapaRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    enderecoRef.current = endereco;
    latRef.current = lat;
    lngRef.current = lng;
  }, [endereco, lat, lng]);

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

  useEffect(
    () => () => {
      if (reversoTimerRef.current != null) {
        window.clearTimeout(reversoTimerRef.current);
      }
    },
    [],
  );

  const gravarPonto = (novoEndereco: string, novaLat: number, novaLng: number) => {
    escolhendoRef.current = true;
    enderecoRef.current = novoEndereco;
    latRef.current = novaLat;
    lngRef.current = novaLng;
    setEndereco(novoEndereco);
    setLat(novaLat);
    setLng(novaLng);
  };

  const aplicarReverso = async (novaLat: number, novaLng: number, seq: number) => {
    const label = await geocodeService.reverso(novaLat, novaLng);
    const enderecoFinal =
      label.trim() ||
      enderecoRef.current.trim() ||
      "Ponto marcado no mapa";
    if (seq !== reversoSeqRef.current) return enderecoFinal;
    gravarPonto(enderecoFinal, novaLat, novaLng);
    pendenteMapaRef.current = null;
    setResolvendoEndereco(false);
    setSugestoes([]);
    setListaAberta(false);
    return enderecoFinal;
  };

  const aoDigitar = (texto: string) => {
    if (reversoTimerRef.current != null) {
      window.clearTimeout(reversoTimerRef.current);
      reversoTimerRef.current = null;
    }
    reversoSeqRef.current += 1;
    pendenteMapaRef.current = null;
    setResolvendoEndereco(false);
    setEndereco(texto);
    setLat(null);
    setLng(null);
    enderecoRef.current = texto;
    latRef.current = null;
    lngRef.current = null;
    setGpsStatus("idle");
    setErroGps(undefined);
    setListaAberta(true);
  };

  const aoDigitarNome = (texto: string) => {
    setNome(texto.slice(0, 60));
  };

  const escolher = (item: SugestaoEndereco) => {
    if (!pontoEstaNoSul(item.lat, item.lng)) {
      setErroGps(ERRO_FORA_DO_SUL);
      return;
    }
    if (reversoTimerRef.current != null) {
      window.clearTimeout(reversoTimerRef.current);
      reversoTimerRef.current = null;
    }
    reversoSeqRef.current += 1;
    pendenteMapaRef.current = null;
    setResolvendoEndereco(false);
    gravarPonto(item.label, item.lat, item.lng);
    setSugestoes([]);
    setListaAberta(false);
    setGpsStatus("idle");
    setErroGps(undefined);
    setVooId((n) => n + 1);
  };

  const preencher = useCallback((local: Localizacao) => {
    if (reversoTimerRef.current != null) {
      window.clearTimeout(reversoTimerRef.current);
      reversoTimerRef.current = null;
    }
    reversoSeqRef.current += 1;
    pendenteMapaRef.current = null;
    setResolvendoEndereco(false);
    gravarPonto(local.endereco, local.lat, local.lng);
    setNome(local.nome ?? "");
    setSugestoes([]);
    setListaAberta(false);
    setGpsStatus("idle");
    setErroGps(undefined);
    setVooId((n) => n + 1);
  }, []);

  const atualizarDoMapa = (novaLat: number, novaLng: number): boolean => {
    if (!pontoEstaNoSul(novaLat, novaLng)) {
      setErroGps(ERRO_FORA_DO_SUL);
      return false;
    }
    latRef.current = novaLat;
    lngRef.current = novaLng;
    setLat(novaLat);
    setLng(novaLng);
    setListaAberta(false);
    setSugestoes([]);
    setGpsStatus("idle");
    setErroGps(undefined);
    setResolvendoEndereco(true);
    pendenteMapaRef.current = { lat: novaLat, lng: novaLng };

    if (reversoTimerRef.current != null) {
      window.clearTimeout(reversoTimerRef.current);
    }
    const seq = ++reversoSeqRef.current;
    reversoTimerRef.current = window.setTimeout(() => {
      reversoTimerRef.current = null;
      void aplicarReverso(novaLat, novaLng, seq);
    }, DEBOUNCE_REVERSO_MAPA_MS);
    return true;
  };

  const resolverPontoPendente = async (): Promise<LocalizacaoForm> => {
    if (reversoTimerRef.current != null) {
      window.clearTimeout(reversoTimerRef.current);
      reversoTimerRef.current = null;
    }
    const pendente = pendenteMapaRef.current;
    if (pendente) {
      await aplicarReverso(pendente.lat, pendente.lng, reversoSeqRef.current);
    }
    return {
      endereco: enderecoRef.current,
      lat: latRef.current,
      lng: lngRef.current,
      nome,
    };
  };

  const usarGps = async () => {
    setGpsStatus("buscando");
    setErroGps(undefined);
    setListaAberta(false);
    try {
      const pos = await obterGps();
      const novaLat = pos.coords.latitude;
      const novaLng = pos.coords.longitude;
      if (!pontoEstaNoSul(novaLat, novaLng)) {
        setGpsStatus("erro");
        setErroGps(ERRO_FORA_DO_SUL);
        return;
      }
      const label = await geocodeService.reverso(novaLat, novaLng);
      if (reversoTimerRef.current != null) {
        window.clearTimeout(reversoTimerRef.current);
        reversoTimerRef.current = null;
      }
      reversoSeqRef.current += 1;
      pendenteMapaRef.current = null;
      setResolvendoEndereco(false);
      gravarPonto(label, novaLat, novaLng);
      setSugestoes([]);
      setGpsStatus("fixado");
      setVooId((n) => n + 1);
    } catch {
      setGpsStatus("erro");
      setErroGps("Autorize a localização ou busque o endereço");
    }
  };

  const valor: LocalizacaoForm = { endereco, lat, lng, nome };

  return {
    valor,
    sugestoes,
    buscando,
    resolvendoEndereco,
    gpsStatus,
    erroGps,
    listaAberta,
    vooId,
    aoDigitar,
    aoDigitarNome,
    escolher,
    preencher,
    atualizarDoMapa,
    resolverPontoPendente,
    fecharLista: () => setListaAberta(false),
    usarGps,
  };
};
