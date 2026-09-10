"use client";

import styles from "../primeiro-acesso.module.css";

type Props = {
  id: string;
  label: string;
  hint?: string;
  hintAbaixo?: string;
  icone?: string;
  prefixo?: string;
  iconeDireita?: string;
  placeholder?: string;
  valor: string;
  onChange: (valor: string) => void;
  erro?: string;
  desabilitado?: boolean;
  autoComplete?: string;
};

export const CampoTexto = ({
  id,
  label,
  hint,
  hintAbaixo,
  icone,
  prefixo,
  iconeDireita,
  placeholder,
  valor,
  onChange,
  erro,
  desabilitado,
  autoComplete,
}: Props) => {
  const erroId = `${id}-erro`;
  const hintId = hintAbaixo ? `${id}-hint` : undefined;

  return (
    <div className={styles.campo}>
      <div className={styles.labelLinha}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {hint ? <span className={styles.hintDestaque}>{hint}</span> : null}
      </div>
      <div className={`${styles.inputWrap} ${erro ? styles.inputWrapErro : ""}`}>
        {prefixo ? (
          <span className={styles.prefixo} aria-hidden>
            {prefixo}
          </span>
        ) : icone ? (
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
          aria-invalid={Boolean(erro)}
          aria-describedby={[erro ? erroId : null, hintId].filter(Boolean).join(" ") || undefined}
        />
        {iconeDireita ? (
          <span className={`material-symbols-outlined ${styles.iconeDireita}`} aria-hidden>
            {iconeDireita}
          </span>
        ) : null}
      </div>
      {hintAbaixo ? (
        <p id={hintId} className={styles.hintAbaixo}>
          {hintAbaixo}
        </p>
      ) : null}
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
