"use client";

import type { AcessoEvento } from "@/types/evento";
import styles from "../convidar.module.css";

type Props = {
  acesso: AcessoEvento;
  total: number;
  enviando: boolean;
  avisoTeto: boolean;
  onConfirmar: () => void;
};

export const BarraConvidar = ({ acesso, total, enviando, avisoTeto, onConfirmar }: Props) => {
  const rotulo = enviando ? "Convidando…" : total > 0 ? `Convidar (${total})` : "Convidar";

  return (
    <div className={styles.barra}>
      {acesso === "ingresso" ? (
        <p className={styles.avisoBarra}>
          Eles confirmam a inscrição. O ingresso continua por fora.
        </p>
      ) : null}
      {avisoTeto ? <p className={styles.avisoBarra}>Dá para chamar até 20 por vez</p> : null}
      <button
        type="button"
        className={styles.confirmar}
        disabled={total === 0 || enviando}
        aria-busy={enviando}
        onClick={() => void onConfirmar()}
      >
        {rotulo}
      </button>
    </div>
  );
};
