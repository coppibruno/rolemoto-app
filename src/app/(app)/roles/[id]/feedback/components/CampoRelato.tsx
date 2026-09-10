"use client";

import {
  AVISO_COMBOIO_CORPO,
  AVISO_COMBOIO_TITULO,
  AVISO_LOCK,
  HINT_OPCIONAL,
  LABEL_RELATO,
  LIMITE_COMENTARIO,
  PLACEHOLDER_RELATO,
} from "../constants";
import styles from "../feedback-role.module.css";

type Props = {
  valor: string;
  onChange: (valor: string) => void;
};

export const CampoRelato = ({ valor, onChange }: Props) => {
  return (
    <section className={styles.blocoRelato}>
      <div className={styles.labelLinha}>
        <label htmlFor="relato-piloto" className={styles.labelSecao}>
          {LABEL_RELATO}
        </label>
        <span className={styles.hintOpcional}>{HINT_OPCIONAL}</span>
      </div>
      <div className={styles.badgeComboio}>
        <span className="material-symbols-outlined" aria-hidden>
          group
        </span>
        <div>
          <span className={styles.badgeComboioTitulo}>{AVISO_COMBOIO_TITULO}</span>
          <span className={styles.badgeComboioCorpo}>{AVISO_COMBOIO_CORPO}</span>
        </div>
      </div>
      <div className={styles.caixaTexto}>
        <textarea
          id="relato-piloto"
          className={styles.textarea}
          rows={3}
          maxLength={LIMITE_COMENTARIO}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER_RELATO}
        />
        <div className={styles.rodapeTexto}>
          <span className={styles.lockLinha}>
            <span className="material-symbols-outlined" aria-hidden>
              lock
            </span>
            {AVISO_LOCK}
          </span>
          <span className={styles.contador} aria-live="polite">
            {valor.length}/{LIMITE_COMENTARIO}
          </span>
        </div>
      </div>
    </section>
  );
};
