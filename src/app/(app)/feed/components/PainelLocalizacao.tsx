"use client";

import type { PontoFeed, StatusLocalizacao } from "../types";
import styles from "../feed.module.css";

type Props = {
  ponto: PontoFeed | null;
  status: StatusLocalizacao;
  onAlterar: () => void;
};

const textoLocal = (ponto: PontoFeed | null, status: StatusLocalizacao) => {
  if (ponto) return ponto.label;
  if (status === "obtendo") return "Obtendo localização…";
  return "Escolha sua localização";
};

export const PainelLocalizacao = ({ ponto, status, onAlterar }: Props) => {
  return (
    <button
      type="button"
      className={styles.linhaLocal}
      onClick={onAlterar}
      aria-label={`Localização: ${textoLocal(ponto, status)}. Toque para alterar`}
    >
      <span className={`material-symbols-outlined ${styles.linhaLocalIcone}`} aria-hidden>
        location_on
      </span>
      <span className={styles.linhaLocalTexto}>{textoLocal(ponto, status)}</span>
      <span className={styles.linhaLocalAcao}>Alterar</span>
    </button>
  );
};
