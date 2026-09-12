"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { normalizarIdentificador } from "../services/identificador.service";
import { solicitarResetSenha } from "../services/recuperar-senha.service";

export const useRecuperarSenha = (identificadorInicial: string) => {
  const [aberto, setAberto] = useState(false);
  const [identificador, setIdentificador] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const abrir = () => {
    setIdentificador(identificadorInicial);
    setSucesso(false);
    setErro(null);
    setAberto(true);
  };

  const fechar = () => setAberto(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizarIdentificador(identificador)) {
      setErro("Preencha o e-mail ou o apelido.");
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      await solicitarResetSenha(identificador);
      setSucesso(true);
    } catch (falha) {
      if (falha instanceof ApiError && falha.status === 400) {
        setErro("Preencha o e-mail ou o apelido.");
      } else {
        setSucesso(true);
      }
    } finally {
      setEnviando(false);
    }
  };

  return {
    aberto,
    identificador,
    setIdentificador,
    enviando,
    sucesso,
    erro,
    abrir,
    fechar,
    enviar,
  };
};
