"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { traduzirErroFirebase, extrairCodigoErro } from "../utils/erros-firebase";

type Modo = "login" | "cadastro";

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
      if (modo === "cadastro") {
        await cadastrarComEmail(email, senha);
      } else {
        await loginComEmail(email, senha);
      }
      router.replace("/");
    } catch (error: unknown) {
      setErro(traduzirErroFirebase(extrairCodigoErro(error)));
    } finally {
      setCarregando(false);
    }
  };

  return {
    modo,
    campos: { email, setEmail, senha, setSenha, confirmarSenha, setConfirmarSenha },
    mostrarSenha,
    toggleSenha,
    erro,
    carregando,
    alternarModo,
    submeter,
  };
};
