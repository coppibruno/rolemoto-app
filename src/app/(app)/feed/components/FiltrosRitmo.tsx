"use client";

import { OPCOES_RITMO } from "../constants";
import type { FiltroRitmo } from "../types";
import styles from "../feed.module.css";

type Props = {
  valor: FiltroRitmo;
  onChange: (valor: FiltroRitmo) => void;
};

const classeRitmo = (ritmo: FiltroRitmo) => {
  if (ritmo === "tranquila") return styles.chipTranquila;
  if (ritmo === "moderada") return styles.chipModerada;
  if (ritmo === "agressiva") return styles.chipAgressiva;
  return "";
};

const classeBolinha = (ritmo: FiltroRitmo) => {
  if (ritmo === "tranquila") return styles.bolinhaTranquila;
  if (ritmo === "moderada") return styles.bolinhaModerada;
  if (ritmo === "agressiva") return styles.bolinhaAgressiva;
  return "";
};

export const FiltrosRitmo = ({ valor, onChange }: Props) => {
  return (
    <div className={styles.filtroGrupo}>
      <div className={styles.filtroLabel}>
        <span className={`material-symbols-outlined ${styles.iconeRitmo}`}>speed</span>
        Ritmo de Pilotagem
      </div>
      <div className={styles.chips} role="radiogroup" aria-label="Ritmo de pilotagem">
        {OPCOES_RITMO.map((opcao) => {
          const ativo = valor === opcao.valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              role="radio"
              aria-checked={ativo}
              className={`${styles.chip} ${styles.chipRitmo} ${classeRitmo(opcao.valor)} ${ativo ? styles.chipRitmoAtivo : ""}`}
              onClick={() => onChange(opcao.valor)}
            >
              {opcao.valor !== "todas" ? (
                <span className={`${styles.bolinha} ${classeBolinha(opcao.valor)}`} />
              ) : null}
              {opcao.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
