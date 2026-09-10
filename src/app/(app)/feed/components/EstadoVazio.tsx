"use client";

import styles from "../feed.module.css";

export const EstadoVazio = () => {
  return (
    <div className={styles.vazio} role="status">
      <span className="material-symbols-outlined">explore_off</span>
      <p className={styles.vazioTitulo}>Nenhum rolê por aqui</p>
      <p className={styles.vazioTexto}>
        Não encontramos rolês com esses filtros. Aumente o raio, mude a data ou o
        ritmo.
      </p>
    </div>
  );
};
