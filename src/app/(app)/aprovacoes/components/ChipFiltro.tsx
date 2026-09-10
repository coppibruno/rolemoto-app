"use client";

import styles from "../aprovacoes.module.css";

type Props = {
  ativo: boolean;
  label: string;
  icone?: string;
  bolinha?: boolean;
  onClick: () => void;
};

export const ChipFiltro = ({ ativo, label, icone, bolinha, onClick }: Props) => {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativo}
      className={`${styles.chip} ${ativo ? styles.chipAtivo : ""}`}
      onClick={onClick}
    >
      {icone ? (
        <span className="material-symbols-outlined" aria-hidden>
          {icone}
        </span>
      ) : null}
      {bolinha ? <span className={styles.chipBolinha} aria-hidden /> : null}
      {label}
    </button>
  );
};
