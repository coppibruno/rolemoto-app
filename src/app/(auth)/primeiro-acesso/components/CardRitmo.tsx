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
      {opcao.recomendado ? (
        <span className={styles.badgeRecomendado}>Recomendado</span>
      ) : null}
      <div className={styles.ritmoTopo}>
        <div className={styles.ritmoIdentidade}>
          <div className={styles.ritmoIconeBox}>
            <span className="material-symbols-outlined" aria-hidden>
              {opcao.icone}
            </span>
          </div>
          <div className={styles.ritmoNomes}>
            <span className={styles.ritmoLabel}>{opcao.label}</span>
            <span className={styles.telemetria}>{opcao.telemetria}</span>
          </div>
        </div>
        <span className={`${styles.radio} ${selecionado ? styles.radioAtivo : ""}`}>
          <span className={styles.radioPonto} />
        </span>
      </div>
      <p className={styles.ritmoDescricao}>{opcao.descricao}</p>
    </button>
  );
};
