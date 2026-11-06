"use client";

import { useEffect, useState } from "react";
import { geocodeService, type SugestaoEndereco } from "@/lib/geocode";
import { ERRO_FORA_DO_SUL, pontoEstaNoSul } from "@/lib/regiao-sul";
import type { AcessoEvento } from "@/types/evento";
import type { Localizacao } from "@/types/role";
import type { SugestaoEvento } from "@/types/sugestao-evento";
import { DEBOUNCE_BUSCA_MS, ENDERECO_MIN } from "../../criar-evento/constants";

const LINK_MAX = 2000;

export const linkHttpValido = (valor: string): boolean => {
  if (!valor || valor.length > LINK_MAX) return false;
  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const pinNoSul = (sugestao: SugestaoEvento): boolean =>
  sugestao.local.lat != null &&
  sugestao.local.lng != null &&
  pontoEstaNoSul(sugestao.local.lat, sugestao.local.lng) &&
  sugestao.local.endereco.trim().length >= ENDERECO_MIN;

export const useComplementoInstagram = (sugestao: SugestaoEvento, acesso: AcessoEvento) => {
  const instagram = sugestao.fonte === "instagram";
  const precisaLugar = instagram && !pinNoSul(sugestao);
  const precisaLink =
    instagram && acesso === "ingresso" && !linkHttpValido(sugestao.linkIngresso ?? "");
  const textoInicial = sugestao.local.endereco || sugestao.local.nome || sugestao.cidade;
  const [endereco, setEndereco] = useState(textoInicial);
  const [ponto, setPonto] = useState<Localizacao | null>(null);
  const [sugestoes, setSugestoes] = useState<SugestaoEndereco[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [listaAberta, setListaAberta] = useState(false);
  const [link, setLink] = useState("");
  const [erroLugar, setErroLugar] = useState<string | null>(null);

  useEffect(() => {
    if (!precisaLugar || ponto || endereco.trim().length < ENDERECO_MIN) {
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
  }, [endereco, ponto, precisaLugar]);

  const aoDigitar = (valor: string) => {
    setEndereco(valor);
    setPonto(null);
    setErroLugar(null);
    setListaAberta(true);
  };

  const escolher = (item: SugestaoEndereco) => {
    if (!pontoEstaNoSul(item.lat, item.lng)) {
      setErroLugar(ERRO_FORA_DO_SUL);
      setPonto(null);
      return;
    }
    setErroLugar(null);
    setEndereco(item.label);
    setPonto({
      lat: item.lat,
      lng: item.lng,
      endereco: item.label,
      nome: sugestao.local.nome || item.label,
    });
    setListaAberta(false);
  };

  const lugarOk = !precisaLugar || (ponto != null && pontoEstaNoSul(ponto.lat, ponto.lng));
  const linkOk = !precisaLink || linkHttpValido(link.trim());

  return {
    instagram,
    precisaLugar,
    precisaLink,
    endereco,
    aoDigitar,
    sugestoes,
    buscando,
    listaAberta,
    abrirLista: () => setListaAberta(true),
    fecharLista: () => setListaAberta(false),
    escolher,
    link,
    setLink,
    erroLugar,
    avisoLugar: precisaLugar && !ponto ? "Escolha um endereço em SC, PR ou RS" : null,
    avisoLink: precisaLink && !linkHttpValido(link.trim()) ? "Informe o link do ingresso" : null,
    pode: lugarOk && linkOk,
    localParaEnvio: precisaLugar ? ponto : null,
    linkParaEnvio: precisaLink ? link.trim() : null,
  };
};
