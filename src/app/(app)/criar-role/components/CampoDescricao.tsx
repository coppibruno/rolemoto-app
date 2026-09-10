"use client";

import { PLACEHOLDER_DESCRICAO } from "../constants";
import styles from "../criar-role.module.css";

type Props = {
  valor: string;
  onChange: (valor: string) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const CampoDescricao = ({
  valor,
  onChange,
  erro,
  desabilitado,
}: Props) => {
  const erroId = "descricao-erro";

  return (
    <div className={`${styles.cartao} ${erro ? styles.cartaoErro : ""}`}>
      <div className={styles.labelLinha}>
        <label htmlFor="instrucoes-comboio" className={styles.label}>
          <span className="material-symbols-outlined" aria-hidden>
            alt_route
          </span>
          Instruções do Comboio
        </label>
        <span className={styles.hintOpcional}>opcional</span>
      </div>
      <textarea
        id="instrucoes-comboio"
        className={`${styles.textarea} ${erro ? styles.inputErro : ""}`}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER_DESCRICAO}
        rows={3}
        disabled={desabilitado}
        maxLength={2000}
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
