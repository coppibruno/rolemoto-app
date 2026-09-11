"use client";

import { useLoginForm } from "../hooks/useLoginForm";
import { useRecuperarSenha } from "../hooks/useRecuperarSenha";
import { SheetRecuperarSenha } from "./SheetRecuperarSenha";
import styles from "../login.module.css";

interface Props {
  desabilitado: boolean;
}

export const FormularioLogin = ({ desabilitado }: Props) => {
  const { modo, campos, mostrarSenha, toggleSenha, erro, carregando, alternarModo, submeter } =
    useLoginForm();
  const reset = useRecuperarSenha(campos.email);

  const bloqueado = desabilitado || carregando;
  const eCadastro = modo === "cadastro";

  return (
    <>
      <form className={styles.formulario} onSubmit={submeter}>
        <div className={styles.campo}>
          <label htmlFor="login-id" className={styles.label}>
            <span>{eCadastro ? "E-mail" : "E-mail ou Apelido"}</span>
            {!eCadastro && <span className={styles.labelHint}>@piloto</span>}
          </label>
          <div className={styles.inputWrapper}>
            <span className={`material-symbols-outlined ${styles.inputIcon}`}>
              {eCadastro ? "mail" : "sports_motorsports"}
            </span>
            <input
              id="login-id"
              type={eCadastro ? "email" : "text"}
              className={`${styles.input} ${styles.inputEllipsis}`}
              placeholder={eCadastro ? "seu@email.com" : "ex: ghost_rider ou piloto@rolemoto.com"}
              value={campos.email}
              onChange={(e) => campos.setEmail(e.target.value)}
              disabled={bloqueado}
              autoComplete="email"
            />
          </div>
        </div>

        <div className={styles.campo}>
          <div className={styles.labelRow}>
            <label htmlFor="login-pass" className={styles.label}>
              Senha
            </label>
            {!eCadastro && (
              <button
                type="button"
                className={styles.linkEsqueceu}
                disabled={bloqueado}
                onClick={reset.abrir}
              >
                Esqueceu a senha?
              </button>
            )}
          </div>
          <div className={styles.inputWrapper}>
            <span className={`material-symbols-outlined ${styles.inputIcon}`}>
              lock_open
            </span>
            <input
              id="login-pass"
              type={mostrarSenha ? "text" : "password"}
              className={styles.input}
              placeholder={eCadastro ? "Mínimo 6 caracteres" : "Digite seu passe"}
              value={campos.senha}
              onChange={(e) => campos.setSenha(e.target.value)}
              disabled={bloqueado}
              autoComplete={eCadastro ? "new-password" : "current-password"}
            />
            <button
              type="button"
              className={styles.toggleSenha}
              onClick={toggleSenha}
              aria-label="Mostrar ou ocultar senha"
              disabled={bloqueado}
            >
              <span className="material-symbols-outlined">
                {mostrarSenha ? "visibility" : "visibility_off"}
              </span>
            </button>
          </div>
        </div>

        {eCadastro && (
          <div className={styles.campo}>
            <label htmlFor="confirmar-senha" className={styles.label}>
              Confirmar senha
            </label>
            <div className={styles.inputWrapper}>
              <span className={`material-symbols-outlined ${styles.inputIcon}`}>
                lock
              </span>
              <input
                id="confirmar-senha"
                type={mostrarSenha ? "text" : "password"}
                className={styles.input}
                placeholder="Repita a senha"
                value={campos.confirmarSenha}
                onChange={(e) => campos.setConfirmarSenha(e.target.value)}
                disabled={bloqueado}
                autoComplete="new-password"
              />
            </div>
          </div>
        )}

        <button type="submit" className={styles.botaoPrimario} disabled={bloqueado}>
          <span>{eCadastro ? "Criar conta" : "Acelerar / Entrar"}</span>
          <span className="material-symbols-outlined">
            {eCadastro ? "person_add" : "arrow_forward"}
          </span>
        </button>
      </form>

      {erro && (
        <div className={styles.erro}>
          <span className="material-symbols-outlined">warning</span>
          {erro}
        </div>
      )}

      <p className={styles.cadastroLink}>
        {eCadastro ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
        <button
          type="button"
          className={styles.linkCadastro}
          onClick={alternarModo}
          disabled={bloqueado}
        >
          {eCadastro ? "Fazer login" : "Cadastre-se"}
        </button>
      </p>

      {reset.aberto ? (
        <SheetRecuperarSenha
          identificador={reset.identificador}
          enviando={reset.enviando}
          sucesso={reset.sucesso}
          erro={reset.erro}
          onIdentificador={reset.setIdentificador}
          onEnviar={reset.enviar}
          onFechar={reset.fechar}
        />
      ) : null}
    </>
  );
};
