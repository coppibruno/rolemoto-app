"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import styles from "../mensagens.module.css";

type Props = {
  titulo: ReactNode;
  hrefVoltar: string;
};

export const CabecalhoMensagens = ({ titulo, hrefVoltar }: Props) => {
  const router = useRouter();

  const voltar = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(hrefVoltar);
  };

  return (
    <header className={styles.cabecalho}>
      <button type="button" className={styles.botaoVoltar} aria-label="Voltar" onClick={voltar}>
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 className={styles.titulo}>{titulo}</h1>
      <span className={styles.espaco} aria-hidden />
    </header>
  );
};
