"use client";

import {
  HINT_RELATO,
  LABEL_RELATO,
  LIMITE_COMENTARIO,
  PLACEHOLDER_RELATO,
} from "../constants";
import styles from "../avaliar.module.css";

type Props = {
  valor: string;
  onChange: (valor: string) => void;
};

export const CampoRelatoPiloto = ({ valor, onChange }: Props) => {
  return (
    <section className={styles.blocoRelato}>
      <div className={styles.blocoTopo}>
        <label className={styles.blocoTitulo} htmlFor="relato-piloto">
          <span className="material-symbols-outlined" aria-hidden>
            rate_review
          </span>
          {LABEL_RELATO}
        </label>
        <span className={styles.contador} aria-live="polite">
          {valor.length}/{LIMITE_COMENTARIO}
        </span>
      </div>
      <textarea
        id="relato-piloto"
        className={styles.textarea}
        maxLength={LIMITE_COMENTARIO}
        placeholder={PLACEHOLDER_RELATO}
        rows={4}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className={styles.dica}>
        <span className="material-symbols-outlined" aria-hidden>
          tips_and_updates
        </span>
        <span>{HINT_RELATO}</span>
      </p>
    </section>
  );
};
