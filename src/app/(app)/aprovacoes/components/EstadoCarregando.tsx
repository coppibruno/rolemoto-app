"use client";

import styles from "../aprovacoes.module.css";

export const EstadoCarregando = () => {
  return (
    <div className={styles.carregando} aria-busy="true" aria-live="polite">
      <div className={styles.skeleton} />
      <div className={styles.skeleton} />
    </div>
  );
};
