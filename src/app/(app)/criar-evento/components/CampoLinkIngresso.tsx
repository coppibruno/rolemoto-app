"use client";

import { LINK_INGRESSO_MAX, PLACEHOLDER_LINK_INGRESSO } from "../constants";
import styles from "../criar-evento.module.css";

type Props = {
  valor: string;
  onChange: (valor: string) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const CampoLinkIngresso = ({
  valor,
  onChange,
  erro,
  desabilitado,
}: Props) => {
  const erroId = "link-ingresso-erro";

  return (
    <div className={styles.campo}>
      <label htmlFor="link-ingresso" className={styles.label}>
        Link da compra do ingresso <span className={styles.obrigatorio}>*</span>
      </label>
      <input
        id="link-ingresso"
        type="url"
        inputMode="url"
        autoComplete="url"
        className={`${styles.input} ${erro ? styles.inputErro : ""}`}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER_LINK_INGRESSO}
        disabled={desabilitado}
        maxLength={LINK_INGRESSO_MAX}
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
