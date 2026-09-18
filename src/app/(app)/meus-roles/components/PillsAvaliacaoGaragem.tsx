"use client";

import type { PillAvaliacaoGaragem } from "@/types/meus-roles";
import { PILLS_AVALIACAO } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  pill: PillAvaliacaoGaragem;
  contagens: Record<PillAvaliacaoGaragem, number>;
  onSelecionar: (pill: PillAvaliacaoGaragem) => void;
};

export const PillsAvaliacaoGaragem = ({
  pill,
  contagens,
  onSelecionar,
}: Props) => {
  return (
    <div className={styles.pillsAvaliacao} role="group" aria-label="Filtro de avaliação">
      {PILLS_AVALIACAO.map((item) => {
        const ativa = pill === item.id;
        const n = contagens[item.id];
        const label =
          item.id === "todos"
            ? item.label
            : `${item.label}${n > 0 ? ` (${n})` : ""}`;
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
            {label}
          </button>
        );
      })}
    </div>
  );
};
