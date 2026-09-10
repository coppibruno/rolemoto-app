"use client";

import { KICKER_PAGINA, SUBTITULO_PAGINA, TITULO_PAGINA } from "../constants";
import styles from "../feedback-role.module.css";

export const CabecalhoAvaliacao = () => {
  return (
    <header>
      <div className={styles.kickerLinha}>
        <span className={styles.kickerIcone} aria-hidden>
          <span className="material-symbols-outlined">route</span>
        </span>
        <span className={styles.kickerLabel}>{KICKER_PAGINA}</span>
      </div>
      <h1 className={styles.tituloPagina}>{TITULO_PAGINA}</h1>
      <p className={styles.subtituloPagina}>{SUBTITULO_PAGINA}</p>
    </header>
  );
};
