"use client";

import { useState } from "react";
import styles from "../redefinir-senha.module.css";

type Props = {
  id: string;
  label: string;
  hint?: string;
  icone: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  ariaMostrar?: string;
  ariaOcultar?: string;
};

export const CampoSenha = ({
  id,
  label,
  hint,
  icone,
  value,
  onChange,
  placeholder,
  autoFocus,
  ariaMostrar = "Mostrar senha",
  ariaOcultar = "Ocultar senha",
}: Props) => {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.label}>
        <span>{label}</span>
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </label>
      <div className={styles.inputWrap}>
        <span className={`material-symbols-outlined ${styles.inputIcone}`}>
          {icone}
        </span>
        <input
          id={id}
          type={visivel ? "text" : "password"}
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          autoFocus={autoFocus}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? ariaOcultar : ariaMostrar}
        >
          <span className="material-symbols-outlined">
            {visivel ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </div>
  );
};
