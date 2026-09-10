"use client";

import styles from "../perfil.module.css";

type Props = {
  id: string;
  label: string;
  hint?: string;
  hintDestaque?: boolean;
  icone: string;
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
  hintDestaque,
  icone,
  valor,
  onChange,
  erro,
  desabilitado,
  autoComplete,
}: Props) => {
  const erroId = `${id}-erro`;

  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.label}>
        <span>{label}</span>
        {hint ? (
          <span className={hintDestaque ? styles.hintDestaque : styles.hint}>
            {hint}
          </span>
        ) : null}
      </label>
      <div className={styles.inputWrapper}>
        <span className={`material-symbols-outlined ${styles.inputIcon}`}>{icone}</span>
        <input
          id={id}
          type="text"
          className={`${styles.input} ${erro ? styles.inputErro : ""}`}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          disabled={desabilitado}
          autoComplete={autoComplete}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? erroId : undefined}
        />
      </div>
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
