"use client";

import type { InputHTMLAttributes } from "react";
import styles from "../primeiro-acesso.module.css";

type Props = {
  id: string;
  label: string;
  icone?: string;
  placeholder?: string;
  valor: string;
  onChange: (valor: string) => void;
  erro?: string;
  hint?: string;
  desabilitado?: boolean;
  autoComplete?: string;
  autoCapitalize?: "off" | "none" | "sentences" | "words" | "characters";
  spellCheck?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
};

export const CampoTexto = ({
  id,
  label,
  icone,
  placeholder,
  valor,
  onChange,
  erro,
  hint,
  desabilitado,
  autoComplete,
  autoCapitalize,
  spellCheck,
  inputMode,
}: Props) => {
  const erroId = `${id}-erro`;
  const hintId = `${id}-hint`;
  const describedBy = [erro ? erroId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={`${styles.inputWrap} ${erro ? styles.inputWrapErro : ""}`}>
        {icone ? (
          <span className={`material-symbols-outlined ${styles.inputIcon}`} aria-hidden>
            {icone}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          className={styles.input}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={desabilitado}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          spellCheck={spellCheck}
          inputMode={inputMode}
          aria-invalid={Boolean(erro)}
          aria-describedby={describedBy || undefined}
        />
      </div>
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
      {hint && !erro ? (
        <p id={hintId} className={styles.hintCampo}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};
