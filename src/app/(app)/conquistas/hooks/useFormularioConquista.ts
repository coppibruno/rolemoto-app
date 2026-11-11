"use client";

import { useCallback, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { ERRO_FORA_DO_SUL, pontoEstaNoSul } from "@/lib/regiao-sul";
import type { ConquistaAdmin } from "@/types/conquista";
import { NOME_MAX, NOME_MIN, RAIO_PADRAO_M } from "../constants";
import { conquistasService } from "../services/conquistas.service";

const mensagemDe = (e: unknown): string =>
  e instanceof ApiError ? e.message : "Falha ao salvar. Tente de novo.";

export const useFormularioConquista = (
  inicial: ConquistaAdmin | null,
  onSalvo: (item: ConquistaAdmin) => void,
) => {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [lat, setLat] = useState<number | null>(inicial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(inicial?.lng ?? null);
  const [raioMetros, setRaioMetros] = useState(inicial?.raioMetros ?? RAIO_PADRAO_M);
  const [erroMapa, setErroMapa] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoArquivar, setConfirmandoArquivar] = useState(false);

  const atualizarDoMapa = useCallback((novaLat: number, novaLng: number): boolean => {
    if (!pontoEstaNoSul(novaLat, novaLng)) {
      setErroMapa(ERRO_FORA_DO_SUL);
      return false;
    }
    setErroMapa(null);
    setLat(novaLat);
    setLng(novaLng);
    return true;
  }, []);

  const nomeLimpo = nome.trim().replace(/\s+/g, " ");
  const nomeValido = nomeLimpo.length >= NOME_MIN && nomeLimpo.length <= NOME_MAX;
  const pinoValido = lat != null && lng != null && pontoEstaNoSul(lat, lng);
  const podeSalvar = nomeValido && pinoValido && !salvando;

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!podeSalvar || lat == null || lng == null) return;
    setSalvando(true);
    setErroGeral(null);
    const dados = { nome: nomeLimpo, lat, lng, raioMetros };
    try {
      onSalvo(
        inicial
          ? await conquistasService.atualizar(inicial.id, dados)
          : await conquistasService.criar(dados),
      );
    } catch (erro) {
      setErroGeral(mensagemDe(erro));
      setSalvando(false);
    }
  };

  const alternarAtiva = async () => {
    if (!inicial) return;
    setSalvando(true);
    setErroGeral(null);
    try {
      onSalvo(await conquistasService.atualizar(inicial.id, { ativa: !inicial.ativa }));
    } catch (erro) {
      setErroGeral(mensagemDe(erro));
      setSalvando(false);
      setConfirmandoArquivar(false);
    }
  };

  return {
    editando: inicial !== null,
    ativa: inicial?.ativa ?? true,
    nome,
    setNome,
    nomeValido,
    lat,
    lng,
    raioMetros,
    setRaioMetros,
    atualizarDoMapa,
    erroMapa,
    erroGeral,
    salvando,
    podeSalvar,
    salvar,
    confirmandoArquivar,
    pedirArquivar: () => setConfirmandoArquivar(true),
    cancelarArquivar: () => setConfirmandoArquivar(false),
    alternarAtiva,
  };
};
