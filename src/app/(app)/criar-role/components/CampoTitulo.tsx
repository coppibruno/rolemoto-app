"use client";

import { PLACEHOLDER_TITULO } from "../constants";
import styles from "../criar-role.module.css";

type Props = {
  valor: string;
  onChange: (valor: string) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const CampoTitulo = ({ valor, onChange, erro, desabilitado }: Props) => {
  const erroId = "titulo-erro";

  return (
    <div className={`${styles.cartao} ${erro ? styles.cartaoErro : ""}`}>
      <label htmlFor="titulo-role" className={styles.label}>
        <span className="material-symbols-outlined" aria-hidden>
          sports_score
        </span>
        Título do Rolê
      </label>
      <input
        id="titulo-role"
        type="text"
        className={`${styles.input} ${erro ? styles.inputErro : ""}`}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER_TITULO}
        disabled={desabilitado}
        maxLength={80}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? erroId : undefined}
      />
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
