"use client";

import { HINT_RECOMENDA, LABEL_RECOMENDA } from "../constants";
import styles from "../avaliar.module.css";

type Props = {
  ativo: boolean;
  onChange: (ativo: boolean) => void;
};

export const ToggleRecomendaComboio = ({ ativo, onChange }: Props) => {
  return (
    <section className={styles.blocoToggle}>
      <div className={styles.toggleLinha}>
        <div className={styles.toggleTexto}>
          <span className={styles.toggleTitulo}>
            <span className="material-symbols-outlined" aria-hidden>
              thumb_up
            </span>
            {LABEL_RECOMENDA}
          </span>
          <p className={styles.toggleHint}>{HINT_RECOMENDA}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={ativo}
          aria-label={LABEL_RECOMENDA}
          className={`${styles.switch} ${ativo ? styles.switchAtivo : ""}`}
          onClick={() => onChange(!ativo)}
        >
          <span className={styles.switchThumb} aria-hidden />
        </button>
      </div>
    </section>
  );
};
