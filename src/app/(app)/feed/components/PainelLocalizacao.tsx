"use client";

import type { ReactNode } from "react";
import type { PontoFeed, StatusLocalizacao } from "../types";
import styles from "../feed.module.css";

type Props = {
  ponto: PontoFeed | null;
  status: StatusLocalizacao;
  onAlterar: () => void;
  children?: ReactNode;
};

const textoLocal = (ponto: PontoFeed | null, status: StatusLocalizacao) => {
  if (ponto) return ponto.label;
  if (status === "obtendo") return "Obtendo localização…";
  return "Ative a localização ou toque em Alterar";
};

export const PainelLocalizacao = ({ ponto, status, onAlterar, children }: Props) => {
  return (
    <section className={styles.painel}>
      <div className={styles.painelLinha}>
        <div className={styles.painelPonto}>
          <span className={styles.pontoPulse} aria-hidden />
          <div className={styles.painelTextos}>
            <span className={styles.painelLabel}>Sua localização atual</span>
            <span className={styles.painelValor}>{textoLocal(ponto, status)}</span>
          </div>
        </div>
        <button
          type="button"
          className={styles.botaoAlterar}
          onClick={onAlterar}
          aria-label="Alterar localização"
        >
          <span className="material-symbols-outlined">my_location</span>
          Alterar
        </button>
      </div>
      {children}
    </section>
  );
};
