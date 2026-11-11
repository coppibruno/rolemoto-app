"use client";

import Link from "next/link";
import { TITULO_PAGINA } from "../constants";
import styles from "../conquistas.module.css";

type Props = {
  /** No formulário volta para a lista; na lista sai para o feed. */
  onVoltar?: () => void;
};

export const CabecalhoConquistas = ({ onVoltar }: Props) => (
  <header className={styles.cabecalho}>
    <div className={styles.cabecalhoInner}>
      {onVoltar ? (
        <button
          type="button"
          className={styles.botaoVoltar}
          onClick={onVoltar}
          aria-label="Voltar para a lista"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      ) : (
        <Link href="/" className={styles.botaoVoltar} aria-label="Voltar para os rolês">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
      )}
      <h1 className={styles.tituloPagina}>{TITULO_PAGINA}</h1>
    </div>
  </header>
);
