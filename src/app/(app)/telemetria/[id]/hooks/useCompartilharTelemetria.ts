"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compartilharArquivo } from "@/lib/compartilhar";
import {
  gerarImagemShareTelemetria,
  nomeArquivoShareTelemetria,
  type DadosImagemTelemetria,
} from "@/lib/telemetria/gerar-imagem-share";

const TOAST_MS = 2500;
const TOAST_SALVO = "Imagem salva neste aparelho";
const TOAST_ERRO = "Não foi possível compartilhar";

export const useCompartilharTelemetria = (dados: DadosImagemTelemetria | null) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const ocupadoRef = useRef(false);
  const imagemRef = useRef<Promise<Blob> | null>(null);

  useEffect(() => {
    if (!dados) {
      imagemRef.current = null;
      return;
    }
    const promessa = gerarImagemShareTelemetria(dados);
    promessa.catch(() => undefined);
    imagemRef.current = promessa;
  }, [dados]);

  const mostrar = useCallback((mensagem: string) => {
    setFeedback(mensagem);
    window.setTimeout(() => setFeedback(null), TOAST_MS);
  }, []);

  const compartilhar = useCallback(async () => {
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
      const texto = dados.apelido.trim()
        ? `${dados.titulo} — telemetria de ${dados.apelido.trim()} no Rolê Moto`
        : `${dados.titulo} — telemetria no Rolê Moto`;
      const resultado = await compartilharArquivo(arquivo, texto);
      if (resultado === "salvo") mostrar(TOAST_SALVO);
      if (resultado === "erro") mostrar(TOAST_ERRO);
    } catch {
      mostrar(TOAST_ERRO);
    } finally {
      ocupadoRef.current = false;
      setOcupado(false);
    }
  }, [dados, mostrar]);

  return { compartilhar, feedback, ocupado };
};
