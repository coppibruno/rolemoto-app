"use client";

import Link from "next/link";
import styles from "../sugestoes-eventos.module.css";

export const CabecalhoSugestoesEventos = () => {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <Link href="/" className={styles.botaoVoltar} aria-label="Voltar para o feed">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className={styles.tituloPagina}>Sugestões</h1>
      </div>
    </header>
  );
};
