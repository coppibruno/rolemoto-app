/**
 * Tela de Login — Ponto de entrada do Rolemoto App.
 *
 * Oferece duas formas de autenticação:
 * - **Login social** via Google (popup)
 * - **Cadastro/Login manual** com email e senha
 *
 * Após autenticação, o `AuthProvider` detecta o usuário e redireciona
 * para o feed (se já tem perfil) ou para completar o cadastro.
 *
 * Componente client-side (usa hooks do browser e interatividade).
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "./login.module.css";

type Modo = "login" | "cadastro";

const LoginPage = () => {
  const { firebaseUser, loading, loginComGoogle, cadastrarComEmail, loginComEmail } =
    useAuth();
  const router = useRouter();

  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  // Se já está logado, redireciona para a home
  if (!loading && firebaseUser) {
    router.replace("/");
    return null;
  }

  const traduzirErroFirebase = (codigo: string): string => {
    const erros: Record<string, string> = {
      "auth/email-already-in-use": "Este email já está cadastrado.",
      "auth/invalid-email": "Email inválido.",
      "auth/weak-password": "A senha deve ter no mínimo 6 caracteres.",
      "auth/user-not-found": "Nenhuma conta encontrada com este email.",
      "auth/wrong-password": "Senha incorreta.",
      "auth/invalid-credential": "Email ou senha incorretos.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde um momento.",
      "auth/popup-closed-by-user": "",
    };
    return erros[codigo] || "Erro ao autenticar. Tente novamente.";
  };

  const handleLoginGoogle = async () => {
    setErro(null);
    setCarregandoLogin(true);

    try {
      await loginComGoogle();
      router.replace("/");
    } catch (error: unknown) {
      const codigo = (error as { code?: string })?.code || "";
      if (codigo === "auth/popup-closed-by-user") {
        setCarregandoLogin(false);
        return;
      }
      setErro(traduzirErroFirebase(codigo));
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
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

    setCarregandoLogin(true);

    try {
      if (modo === "cadastro") {
        await cadastrarComEmail(email, senha);
      } else {
        await loginComEmail(email, senha);
      }
      router.replace("/");
    } catch (error: unknown) {
      const codigo = (error as { code?: string })?.code || "";
      setErro(traduzirErroFirebase(codigo));
    } finally {
      setCarregandoLogin(false);
    }
  };

  const alternarModo = () => {
    setModo(modo === "login" ? "cadastro" : "login");
    setErro(null);
    setConfirmarSenha("");
  };

  const desabilitado = carregandoLogin || loading;

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        {/* Logo e título */}
        <div className={styles.header}>
          <div className={styles.logoIcon}>🏍️</div>
          <h1 className={styles.titulo}>Rolemoto</h1>
          <p className={styles.subtitulo}>
            Encontre motociclistas e organize rolês incríveis
          </p>
        </div>

        {/* Formulário de email/senha */}
        <form className={styles.formulario} onSubmit={handleSubmitEmail}>
          <h2 className={styles.tituloFormulario}>
            {modo === "login" ? "Entrar" : "Criar conta"}
          </h2>

          <div className={styles.campo}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={desabilitado}
              autoComplete="email"
            />
          </div>

          <div className={styles.campo}>
            <label htmlFor="senha" className={styles.label}>
              Senha
            </label>
            <input
              id="senha"
              type="password"
              className={styles.input}
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={desabilitado}
              autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
            />
          </div>

          {modo === "cadastro" && (
            <div className={styles.campo}>
              <label htmlFor="confirmarSenha" className={styles.label}>
                Confirmar senha
              </label>
              <input
                id="confirmarSenha"
                type="password"
                className={styles.input}
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                disabled={desabilitado}
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            className={styles.botaoSubmit}
            disabled={desabilitado}
          >
            {modo === "login" ? "Entrar" : "Criar conta"}
          </button>

          <p className={styles.alternarModo}>
            {modo === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              className={styles.linkAlternar}
              onClick={alternarModo}
              disabled={desabilitado}
            >
              {modo === "login" ? "Cadastre-se" : "Fazer login"}
            </button>
          </p>
        </form>

        {/* Divisor */}
        <div className={styles.divisor}>
          <span>ou</span>
        </div>

        {/* Botão Google */}
        <div className={styles.botoesContainer}>
          <button
            className={`${styles.botaoLogin} ${styles.botaoGoogle}`}
            onClick={handleLoginGoogle}
            disabled={desabilitado}
          >
            <svg className={styles.iconeProvedor} viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Entrar com Google
          </button>
        </div>

        {/* Mensagem de erro */}
        {erro && (
          <div className={styles.erro}>
            <span>⚠️</span> {erro}
          </div>
        )}

        {/* Loading */}
        {(carregandoLogin || loading) && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Conectando...</span>
          </div>
        )}

        {/* Rodapé */}
        <p className={styles.rodape}>
          Ao entrar, você concorda com nossos termos de uso.
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
