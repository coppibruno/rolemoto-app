"use client";

import { PLACEHOLDER_INFORMACOES } from "../constants";
import styles from "../criar-evento.module.css";

type Props = {
  valor: string;
  onChange: (valor: string) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const CampoInformacoes = ({
  valor,
  onChange,
  erro,
  desabilitado,
}: Props) => {
  const erroId = "informacoes-evento-erro";

  return (
    <div className={styles.campo}>
      <label htmlFor="informacoes-evento" className={`${styles.label} ${styles.labelLinha}`}>
        <span>Informações & Recados para os Pilotos</span>
        <span className={styles.hintOpcional}>Dicas, regras e avisos</span>
      </label>
      <textarea
        id="informacoes-evento"
        className={`${styles.textarea} ${erro ? styles.inputErro : ""}`}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER_INFORMACOES}
        rows={4}
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
