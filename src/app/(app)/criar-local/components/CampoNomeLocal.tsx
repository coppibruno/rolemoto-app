"use client";

import { PLACEHOLDER_NOME } from "../constants";
import styles from "../criar-local.module.css";

type Props = {
  valor: string;
  onChange: (valor: string) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const CampoNomeLocal = ({ valor, onChange, erro, desabilitado }: Props) => {
  const erroId = "nome-local-erro";

  return (
    <div className={`${styles.cartao} ${erro ? styles.cartaoErro : ""}`}>
      <label htmlFor="nome-local" className={styles.label}>
        Nome do Local / Ponto Oficial *
      </label>
      <div className={styles.campoIcone}>
        <span className={`material-symbols-outlined ${styles.iconeInput}`} aria-hidden>
          storefront
        </span>
        <input
          id="nome-local"
          type="text"
          className={`${styles.input} ${erro ? styles.inputErro : ""}`}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER_NOME}
          disabled={desabilitado}
          maxLength={80}
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
