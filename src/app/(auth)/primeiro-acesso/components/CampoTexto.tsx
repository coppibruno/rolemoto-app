"use client";

import styles from "../primeiro-acesso.module.css";

type Props = {
  id: string;
  label: string;
  icone?: string;
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
  icone,
  placeholder,
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
