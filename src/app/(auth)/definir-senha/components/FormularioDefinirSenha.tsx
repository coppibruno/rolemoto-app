"use client";

import { useEffect, useRef, useState } from "react";
import { OpcoesSalvarSenha } from "../../components/OpcoesSalvarSenha";
import { COPY } from "../constants";
import { useDefinirSenha } from "../hooks/useDefinirSenha";
import styles from "../definir-senha.module.css";

type Props = {
  next: string | null;
  email: string;
};

export const FormularioDefinirSenha = ({ next, email }: Props) => {
  const form = useDefinirSenha(next, email);
  const [mostrar, setMostrar] = useState(false);
  const senhaRef = useRef<HTMLInputElement>(null);
  const confirmaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (form.campoErro === "senha") senhaRef.current?.focus();
    if (form.campoErro === "confirmacao") confirmaRef.current?.focus();
  }, [form.campoErro, form.erro]);

  return (
    <>
      {form.toast ? (
        <div className={styles.toast} role="alert">
          <span className="material-symbols-outlined" aria-hidden>
            warning
          </span>
          {form.toast}
        </div>
      ) : null}
    <form className={styles.form} onSubmit={form.submeter}>
      <div className={styles.campo}>
        <label htmlFor="definir-senha" className={styles.label}>
          <span>{COPY.labelSenha}</span>
          <span className={styles.hint}>{COPY.hintMinimo}</span>
        </label>
        <div className={styles.inputWrap}>
          <input
            id="definir-senha"
            ref={senhaRef}
            type={mostrar ? "text" : "password"}
            className={styles.input}
            value={form.senha}
            onChange={(e) => form.setSenha(e.target.value)}
            placeholder={COPY.placeholderSenha}
            autoComplete="new-password"
            disabled={form.enviando}
            aria-invalid={form.campoErro === "senha"}
            aria-describedby={form.campoErro === "senha" ? "definir-senha-erro" : undefined}
          />
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setMostrar((v) => !v)}
            aria-label="Mostrar ou ocultar senha"
          >
            <span className="material-symbols-outlined">
              {mostrar ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
        {form.campoErro === "senha" && form.erro ? (
          <p id="definir-senha-erro" className={styles.erro} role="alert">
            {form.erro}
          </p>
        ) : null}
      </div>

      <div className={styles.campo}>
        <label htmlFor="definir-confirma" className={styles.label}>
          {COPY.labelConfirmar}
        </label>
        <div className={styles.inputWrap}>
          <input
            id="definir-confirma"
            ref={confirmaRef}
            type={mostrar ? "text" : "password"}
            className={styles.input}
            value={form.confirmacao}
            onChange={(e) => form.setConfirmacao(e.target.value)}
            placeholder={COPY.placeholderConfirmar}
            autoComplete="new-password"
            disabled={form.enviando}
            aria-invalid={form.campoErro === "confirmacao"}
            aria-describedby={
              form.campoErro === "confirmacao" ? "definir-confirma-erro" : undefined
            }
          />
        </div>
        {form.campoErro === "confirmacao" && form.erro ? (
          <p id="definir-confirma-erro" className={styles.erro} role="alert">
            {form.erro}
          </p>
        ) : null}
      </div>

      <OpcoesSalvarSenha
        salvarSenha={form.salvarSenha}
        entrarAutomatico={form.entrarAutomatico}
        desabilitado={form.enviando}
        onSalvarSenha={form.setSalvarSenha}
        onEntrarAutomatico={form.setEntrarAutomatico}
      />

      {form.erro && !form.campoErro ? (
        <p className={styles.erro} role="alert">
          {form.erro}
        </p>
      ) : null}

      <button type="submit" className={styles.cta} disabled={form.enviando}>
        {form.enviando ? COPY.ctaEnviando : COPY.cta}
      </button>
      <button
        type="button"
        className={styles.pular}
        onClick={form.pular}
        disabled={form.enviando}
      >
        {COPY.pular}
      </button>
    </form>
    </>
  );
};
