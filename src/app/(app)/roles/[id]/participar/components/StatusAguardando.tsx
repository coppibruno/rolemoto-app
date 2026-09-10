"use client";

import styles from "../confirmacao-role.module.css";

export const StatusAguardando = () => {
  return (
    <div className={styles.statusPill}>
      <span className={styles.pulso} aria-hidden>
        <span className={styles.pulsoPing} />
        <span className={styles.pulsoPonto} />
      </span>
      <span className={styles.statusTexto}>Aguardando Piloto Líder</span>
    </div>
  );
};
