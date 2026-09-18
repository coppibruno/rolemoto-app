"use client";

import styles from "../avaliar.module.css";

export const EstadoCarregando = () => {
  return (
    <div className={styles.carregando} aria-busy="true">
      <span
        className={`material-symbols-outlined ${styles.spin}`}
        aria-hidden
      >
        progress_activity
      </span>
      Carregando…
    </div>
  );
};
