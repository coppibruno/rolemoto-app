"use client";

import styles from "../feed.module.css";

export const EstadoCarregando = () => {
  return (
    <div className={styles.lista} aria-busy="true" aria-live="polite">
      <div className={styles.skeleton} />
      <div className={styles.skeleton} />
    </div>
  );
};
