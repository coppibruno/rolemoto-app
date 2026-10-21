"use client";

import type { RecorteLocaisGaragem } from "@/types/meus-roles";
import { PILLS_RECORTE_LOCAIS } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  recorte: RecorteLocaisGaragem;
  onSelecionar: (recorte: RecorteLocaisGaragem) => void;
};

export const PillsRecorteLocais = ({ recorte, onSelecionar }: Props) => {
  return (
    <div className={styles.pillsAvaliacao} role="group" aria-label="Favoritos ou visitados">
      {PILLS_RECORTE_LOCAIS.map((item) => {
        const ativa = recorte === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={
              ativa
                ? `${styles.pillAvaliacao} ${styles.pillAvaliacaoAtiva}`
                : styles.pillAvaliacao
            }
            aria-pressed={ativa}
            onClick={() => onSelecionar(item.id)}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {item.icone}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
