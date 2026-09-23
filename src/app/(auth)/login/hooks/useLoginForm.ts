"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import {
  contaGoogleSemSenha,
  deveTentarAutoLogin,
  lerCredenciais,
  persistirAposSenha,
  salvarCredenciais,
} from "@/lib/credenciais-login";
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
const ERRO_CONTA_GOOGLE =
  "Esta conta entra com o Google. Use o botão abaixo ou crie uma senha depois de entrar.";

export const useLoginForm = (modoCadastro: boolean) => {
  const { cadastrarComEmail, loginComEmail } = useAuth();

  const [modo, setModo] = useState<Modo>(modoCadastro ? "cadastro" : "login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvarSenha, setSalvarSenha] = useState(true);
  const [entrarAutomatico, setEntrarAutomatico] = useState(true);
  const [avisoGoogle, setAvisoGoogle] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const toggleSenha = () => setMostrarSenha((v) => !v);

  const persistir = (emailConta: string, senhaConta: string) => {
    persistirAposSenha({
      email: emailConta,
      senha: senhaConta,
      salvarSenha,
      entrarAutomatico,
    });
  };

  const entrar = async (identificador: string, senhaConta: string) => {
    setErro(null);

    if (!identificador.trim() || !senhaConta.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (modo === "cadastro" && senhaConta !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (modo === "login" && contaGoogleSemSenha(identificador)) {
      setErro(ERRO_CONTA_GOOGLE);
      return;
    }

    setCarregando(true);
    try {
      if (modo === "cadastro") {
        await cadastrarComEmail(identificador, senhaConta);
        persistir(identificador, senhaConta);
        return;
      }

      const emailConta = await resolverEmailDaConta(identificador);
      await loginComEmail(emailConta, senhaConta);
      persistir(emailConta, senhaConta);
    } catch (error: unknown) {
      console.error(error);
      const apelido = !normalizarIdentificador(identificador).includes("@");
      if (contaGoogleSemSenha(identificador)) {
        setErro(ERRO_CONTA_GOOGLE);
        return;
      }
      if (
        modo === "login" &&
        (apelido || error instanceof ApiError || error instanceof TypeError)
      ) {
        setErro(ERRO_CREDENCIAL);
        return;
      }
      const codigo = extrairCodigoErro(error);
      if (
        codigo === "auth/invalid-credential" ||
        codigo === "auth/wrong-password"
      ) {
        const salvas = lerCredenciais();
        if (salvas?.senha) {
          salvarCredenciais({ ...salvas, senha: "", entrarAutomatico: false });
        }
      }
      setErro(traduzirErroFirebase(codigo));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const salvas = lerCredenciais();
    if (!salvas) return;
    setEmail(salvas.email);
    if (salvas.senha) setSenha(salvas.senha);
    setSalvarSenha(Boolean(salvas.senha) || salvas.entrarAutomatico);
    setEntrarAutomatico(salvas.entrarAutomatico);
    setAvisoGoogle(salvas.metodo === "google" && !salvas.temSenha && !salvas.senha);

    if (modoCadastro || !deveTentarAutoLogin(salvas)) return;
    void entrar(salvas.email, salvas.senha);
    // Só hidrata / tenta auto-login uma vez ao montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alternarModo = () => {
    setModo((m) => (m === "login" ? "cadastro" : "login"));
    setErro(null);
    setConfirmarSenha("");
  };

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    await entrar(email, senha);
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
    salvarSenha,
    setSalvarSenha,
    entrarAutomatico,
    setEntrarAutomatico,
    avisoGoogle,
    erro,
    carregando,
    alternarModo,
    submeter,
  };
};
