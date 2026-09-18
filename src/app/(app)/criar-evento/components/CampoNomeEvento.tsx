"use client";

import { PLACEHOLDER_NOME } from "../constants";
import styles from "../criar-evento.module.css";

type Props = {
  valor: string;
  onChange: (valor: string) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const CampoNomeEvento = ({
  valor,
  onChange,
  erro,
  desabilitado,
}: Props) => {
  const erroId = "nome-evento-erro";

  return (
    <div className={styles.campo}>
      <label htmlFor="nome-evento" className={styles.label}>
        Nome do Evento <span className={styles.obrigatorio}>*</span>
      </label>
      <input
        id="nome-evento"
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
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
