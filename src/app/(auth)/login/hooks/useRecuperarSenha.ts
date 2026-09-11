"use client";

import { useState } from "react";
import { enviarResetSenha } from "@/lib/auth";
import {
  normalizarIdentificador,
  resolverEmailDaConta,
} from "../services/identificador.service";

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
      const email = await resolverEmailDaConta(identificador);
      await enviarResetSenha(email);
    } catch {
      // Conta inexistente ou falha de rede: mesma copy, não enumerar usuários.
    } finally {
      setSucesso(true);
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
