"use client";

import Link from "next/link";
import styles from "../sugestoes-locais.module.css";

export const CabecalhoSugestoesLocais = () => {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <Link href="/locais" className={styles.botaoVoltar} aria-label="Voltar para locais">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className={styles.tituloPagina}>Sugestões</h1>
      </div>
    </header>
  );
};
