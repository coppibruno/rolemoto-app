"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { dispensarOfertaSenha, persistirAposSenha } from "@/lib/credenciais-login";
import { destinoAposDefinirSenha } from "@/lib/destino-apos-auth";
import { extrairCodigoErro, traduzirErroFirebase } from "../../login/utils/erros-firebase";
import { COPY, MIN_SENHA } from "../constants";

export const useDefinirSenha = (next: string | null, email: string) => {
  const { vincularSenha, loginComGoogle, usuario } = useAuth();
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvarSenha, setSalvarSenha] = useState(true);
  const [entrarAutomatico, setEntrarAutomatico] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const seguir = () => {
    router.replace(destinoAposDefinirSenha(usuario, next));
  };

  const pular = () => {
    if (email) dispensarOfertaSenha(email);
    seguir();
  };

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!email) {
      setErro(COPY.semEmail);
      return;
    }
    if (senha.length < MIN_SENHA) {
      setErro(COPY.senhaFraca);
      return;
    }
    if (senha !== confirmacao) {
      setErro(COPY.senhasDiferentes);
      return;
    }

    setEnviando(true);
    try {
      try {
        await vincularSenha(senha);
      } catch (error: unknown) {
        if (extrairCodigoErro(error) !== "auth/requires-recent-login") {
          throw error;
        }
        await loginComGoogle();
        await vincularSenha(senha);
      }
      persistirAposSenha({
        email,
        senha,
        salvarSenha,
        entrarAutomatico,
      });
      seguir();
    } catch (error: unknown) {
      console.error(error);
      const codigo = extrairCodigoErro(error);
      setErro(codigo ? traduzirErroFirebase(codigo) : COPY.erroGenerico);
    } finally {
      setEnviando(false);
    }
  };

  return {
    senha,
    setSenha,
    confirmacao,
    setConfirmacao,
    salvarSenha,
    setSalvarSenha,
    entrarAutomatico,
    setEntrarAutomatico,
    enviando,
    erro,
    submeter,
    pular,
  };
};
