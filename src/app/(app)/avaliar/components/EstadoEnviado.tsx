"use client";

import styles from "../avaliar.module.css";

export const EstadoEnviado = () => {
  return (
    <div className={styles.enviado} role="status">
      <span className="material-symbols-outlined" aria-hidden>
        check_circle
      </span>
      Avaliação publicada!
    </div>
  );
};
