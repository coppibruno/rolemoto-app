"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  compartilharArquivo,
  salvarArquivo,
  type ResultadoCompartilhar,
} from "@/lib/compartilhar";
import {
  gerarImagemShareTelemetria,
  nomeArquivoShareTelemetria,
  type DadosImagemTelemetria,
} from "@/lib/telemetria/gerar-imagem-share";
import { TOAST_COMPARTILHAR_TELEMETRIA as TOAST } from "../constants";

const TOAST_MS = 2500;

const textoShare = (dados: DadosImagemTelemetria): string =>
  dados.apelido.trim()
    ? `${dados.titulo} — telemetria de ${dados.apelido.trim()} no Rolê Moto`
    : `${dados.titulo} — telemetria no Rolê Moto`;

const mensagemDe = (resultado: ResultadoCompartilhar): string | null => {
  if (resultado === "salvo") return TOAST.salvo;
  if (resultado === "desatualizado") return TOAST.desatualizado;
  if (resultado === "erro") return TOAST.erro;
  return null;
};

export const useCompartilharTelemetria = (dados: DadosImagemTelemetria | null) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const ocupadoRef = useRef(false);
  const imagemRef = useRef<Promise<Blob> | null>(null);

  useEffect(() => {
    setPreviewUrl(null);
    if (!dados) {
      imagemRef.current = null;
      return;
    }
    let ativo = true;
    let url: string | null = null;
    const promessa = gerarImagemShareTelemetria(dados);
    imagemRef.current = promessa;
    promessa
      .then((blob) => {
        if (!ativo) return;
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [dados]);

  const mostrar = useCallback((mensagem: string) => {
    setFeedback(mensagem);
    window.setTimeout(() => setFeedback(null), TOAST_MS);
  }, []);

  const executar = useCallback(
    async (
      acao: (arquivo: File, texto: string) => Promise<ResultadoCompartilhar>,
    ) => {
      if (!dados || ocupadoRef.current) return;
      ocupadoRef.current = true;
      setOcupado(true);
      try {
        const blob = await (imagemRef.current ?? gerarImagemShareTelemetria(dados)).catch(
          () => gerarImagemShareTelemetria(dados),
        );
        const arquivo = new File([blob], nomeArquivoShareTelemetria(dados.titulo), {
          type: "image/png",
        });
        const resultado = await acao(arquivo, textoShare(dados));
        const mensagem = mensagemDe(resultado);
        if (mensagem) mostrar(mensagem);
        if (resultado === "compartilhado" || resultado === "salvo") setAberto(false);
      } catch {
        mostrar(TOAST.erro);
      } finally {
        ocupadoRef.current = false;
        setOcupado(false);
      }
    },
    [dados, mostrar],
  );

  const abrir = useCallback(() => {
    if (dados) setAberto(true);
  }, [dados]);

  const fechar = useCallback(() => setAberto(false), []);

  const compartilhar = useCallback(() => executar(compartilharArquivo), [executar]);

  const salvar = useCallback(() => executar(salvarArquivo), [executar]);

  return { abrir, fechar, aberto, compartilhar, salvar, previewUrl, feedback, ocupado };
};
