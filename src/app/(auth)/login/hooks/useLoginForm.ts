"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import {
  traduzirErroFirebase,
  extrairCodigoErro,
} from "../utils/erros-firebase";
import {
  normalizarIdentificador,
  resolverEmailDaConta,
} from "../services/identificador.service";

type Modo = "login" | "cadastro";

const ERRO_CREDENCIAL = "Email ou senha incorretos.";

export const useLoginForm = () => {
  const { cadastrarComEmail, loginComEmail } = useAuth();
  const router = useRouter();

  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const toggleSenha = () => setMostrarSenha((v) => !v);

  const alternarModo = () => {
    setModo((m) => (m === "login" ? "cadastro" : "login"));
    setErro(null);
    setConfirmarSenha("");
  };

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (modo === "cadastro" && senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      console.log("aqui2");
      if (modo === "cadastro") {
        await cadastrarComEmail(email, senha);
      } else {
        const emailConta = await resolverEmailDaConta(email);
        await loginComEmail(emailConta, senha);
      }
      router.replace("/");
    } catch (error: unknown) {
      console.log("aqui1", error);
      const apelido = !normalizarIdentificador(email).includes("@");
      if (
        modo === "login" &&
        (apelido || error instanceof ApiError || error instanceof TypeError)
      ) {
        setErro(ERRO_CREDENCIAL);
        return;
      }
      setErro(traduzirErroFirebase(extrairCodigoErro(error)));
    } finally {
      setCarregando(false);
    }
  };

  return {
    modo,
    campos: {
      email,
      setEmail,
      senha,
      setSenha,
      confirmarSenha,
      setConfirmarSenha,
    },
    mostrarSenha,
    toggleSenha,
    erro,
    carregando,
    alternarModo,
    submeter,
  };
};
