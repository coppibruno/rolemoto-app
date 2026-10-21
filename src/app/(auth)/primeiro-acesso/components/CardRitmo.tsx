"use client";

import type { Pilotagem } from "@/types/user";
import type { OpcaoRitmoHabitual } from "../constants";
import styles from "../primeiro-acesso.module.css";

const classeRitmo: Record<Pilotagem, string> = {
  tranquila: styles.cardRitmoTranquila,
  moderada: styles.cardRitmoModerada,
  agressiva: styles.cardRitmoAgressiva,
};

type Props = {
  opcao: OpcaoRitmoHabitual;
  selecionado: boolean;
  onSelect: () => void;
  desabilitado?: boolean;
};

export const CardRitmo = ({ opcao, selecionado, onSelect, desabilitado }: Props) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selecionado}
      className={`${styles.cardRitmo} ${classeRitmo[opcao.valor]} ${
        selecionado ? styles.cardRitmoAtivo : ""
      }`}
      onClick={onSelect}
      disabled={desabilitado}
    >
      <span className={styles.ritmoBolinha} aria-hidden />
      <span className={styles.ritmoTextos}>
        <span className={styles.ritmoLabel}>{opcao.label}</span>
        <span className={styles.ritmoDescricao}>{opcao.descricao}</span>
      </span>
      <span className={`${styles.radio} ${selecionado ? styles.radioAtivo : ""}`} aria-hidden>
        <span className={styles.radioPonto} />
      </span>
    </button>
  );
};
