"use client";

import styles from "../offline.module.css";

export const TelaOffline = () => {
  return (
    <main className={styles.tela}>
      <span className={`material-symbols-outlined ${styles.icone}`} aria-hidden>
        wifi_off
      </span>
      <h1 className={styles.titulo}>Sem conexão</h1>
      <p className={styles.corpo}>
        Os rolês precisam de internet. Filtros, mapa e o login não funcionam
        offline.
      </p>
      <button
        type="button"
        className={styles.botao}
        onClick={() => window.location.reload()}
      >
        Tentar de novo
      </button>
    </main>
  );
};
