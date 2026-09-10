"use client";

import { CTA_ENVIADO } from "../constants";
import styles from "../feedback-role.module.css";

export const EstadoEnviado = () => {
  return (
    <button
      type="button"
      className={`${styles.ctaPrimario} ${styles.ctaEnviado}`}
      disabled
    >
      <span>{CTA_ENVIADO}</span>
      <span className="material-symbols-outlined" aria-hidden>
        check_circle
      </span>
    </button>
  );
};
