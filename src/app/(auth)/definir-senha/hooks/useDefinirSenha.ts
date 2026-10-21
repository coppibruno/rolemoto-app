"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { dispensarOfertaSenha, persistirAposSenha } from "@/lib/credenciais-login";
import { destinoAposDefinirSenha } from "@/lib/destino-apos-auth";
import { extrairCodigoErro, traduzirErroFirebase } from "../../login/utils/erros-firebase";
import { COPY, MIN_SENHA } from "../constants";

export type CampoDefinirSenha = "senha" | "confirmacao";

const TOAST_MS = 4000;

export const useDefinirSenha = (next: string | null, email: string) => {
  const { vincularSenha, loginComGoogle, usuario } = useAuth();
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvarSenha, setSalvarSenha] = useState(true);
  const [entrarAutomatico, setEntrarAutomatico] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [campoErro, setCampoErro] = useState<CampoDefinirSenha | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  const reportar = (mensagem: string, campo: CampoDefinirSenha | null) => {
    setErro(mensagem);
    setCampoErro(campo);
    setToast(mensagem);
  };

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
    setCampoErro(null);
    setToast(null);

    if (!email) {
      reportar(COPY.semEmail, null);
      return;
    }
    if (senha.length < MIN_SENHA) {
      reportar(COPY.senhaFraca, "senha");
      return;
    }
    if (senha !== confirmacao) {
      reportar(COPY.senhasDiferentes, "confirmacao");
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
      const mensagem = codigo ? traduzirErroFirebase(codigo) : COPY.erroGenerico;
      const campo: CampoDefinirSenha | null =
        codigo === "auth/weak-password" ? "senha" : null;
      reportar(mensagem, campo);
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
    campoErro,
    toast,
    submeter,
    pular,
  };
};
