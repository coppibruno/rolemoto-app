"use client";

import styles from "../confirmacao-role.module.css";

export const EstadoCarregando = () => {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-live="polite" />
  );
};
