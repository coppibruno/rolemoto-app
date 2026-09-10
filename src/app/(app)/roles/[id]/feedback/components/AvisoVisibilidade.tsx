"use client";

import { AVISO_FEED } from "../constants";
import styles from "../feedback-role.module.css";

export const AvisoVisibilidade = () => {
  return (
    <div className={styles.avisoVisibilidade}>
      <span className="material-symbols-outlined" aria-hidden>
        groups
      </span>
      <p>{AVISO_FEED}</p>
    </div>
  );
};
