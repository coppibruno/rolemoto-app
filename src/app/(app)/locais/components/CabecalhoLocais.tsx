"use client";

import Link from "next/link";
import styles from "../locais.module.css";

type Props = {
  admin: boolean;
};

export const CabecalhoLocais = ({ admin }: Props) => {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <div className={styles.cabecalhoEsquerda}>
          <Link href="/" className={styles.botaoVoltar} aria-label="Voltar para os rolês">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className={styles.tituloPagina}>Locais oficiais</h1>
        </div>
        {admin ? (
          <Link
            href="/criar-local"
            className={styles.botaoCadastrar}
            aria-label="Cadastrar local"
          >
            <span className="material-symbols-outlined">add</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
};
