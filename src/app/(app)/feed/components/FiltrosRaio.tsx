"use client";

import { OPCOES_RAIO } from "../constants";
import type { RaioKm } from "../types";
import styles from "../feed.module.css";

type Props = {
  valor: RaioKm;
  onChange: (valor: RaioKm) => void;
};

export const FiltrosRaio = ({ valor, onChange }: Props) => {
  return (
    <div className={styles.filtroGrupo}>
      <div className={styles.filtroLabel}>
        <span className="material-symbols-outlined">near_me</span>
        Raio de Saída
      </div>
      <div className={styles.chips} role="radiogroup" aria-label="Raio de saída">
        {OPCOES_RAIO.map((opcao) => {
          const ativo = valor === opcao.valor;
          return (
            <button
              key={String(opcao.valor)}
              type="button"
              role="radio"
              aria-checked={ativo}
              className={`${styles.chip} ${ativo ? styles.chipRaioAtivo : ""}`}
              onClick={() => onChange(opcao.valor)}
            >
              {opcao.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
