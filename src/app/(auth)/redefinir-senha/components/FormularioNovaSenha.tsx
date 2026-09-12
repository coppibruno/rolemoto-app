"use client";

import { useState } from "react";
import { COPY, MIN_SENHA } from "../constants";
import { CampoSenha } from "./CampoSenha";
import { PillConferenciaSenha } from "./PillConferenciaSenha";
import styles from "../redefinir-senha.module.css";

type Props = {
  enviando: boolean;
  exito: boolean;
  erro: string | null;
  onSubmit: (senha: string, confirmacao: string) => void;
};

export const FormularioNovaSenha = ({
  enviando,
  exito,
  erro,
  onSubmit,
}: Props) => {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const valido = senha === confirmacao && senha.length >= MIN_SENHA;
  const bloqueado = !valido || enviando || exito;

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (bloqueado) return;
        onSubmit(senha, confirmacao);
      }}
    >
      <CampoSenha
        id="nova-senha"
        label={COPY.labelNova}
        hint={COPY.hintMinimo}
        icone="key"
        value={senha}
        onChange={setSenha}
        placeholder={COPY.placeholderNova}
        autoFocus
      />
      <CampoSenha
        id="confirmar-senha"
        label={COPY.labelConfirmar}
        icone="lock_clock"
        value={confirmacao}
        onChange={setConfirmacao}
        placeholder={COPY.placeholderConfirmar}
        ariaMostrar="Mostrar confirmação de senha"
        ariaOcultar="Ocultar confirmação de senha"
      />
      <PillConferenciaSenha senha={senha} confirmacao={confirmacao} />
      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
      <button
        type="submit"
        className={`${styles.cta} ${exito ? styles.ctaExito : ""}`}
        disabled={bloqueado}
        aria-disabled={bloqueado}
      >
        <span>
          {exito ? COPY.ctaExito : enviando ? COPY.ctaEnviando : COPY.ctaIdle}
        </span>
        <span className={`material-symbols-outlined ${enviando ? styles.spin : ""}`}>
          {exito ? "check_circle" : enviando ? "progress_activity" : "arrow_forward"}
        </span>
      </button>
      <p className={styles.microcopy}>
        <span className="material-symbols-outlined">shield</span>
        {COPY.microcopy}
      </p>
    </form>
  );
};
