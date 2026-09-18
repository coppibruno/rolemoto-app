"use client";

import { CTA_SALVAR, CTA_SALVANDO } from "../constants";
import styles from "../criar-local.module.css";

type Props = {
  salvando: boolean;
};

export const BotaoSalvarLocal = ({ salvando }: Props) => {
  return (
    <button type="submit" className={styles.botaoSalvar} disabled={salvando}>
      {salvando ? (
        <span className={`material-symbols-outlined ${styles.girando}`}>
          autorenew
        </span>
      ) : (
        <span className="material-symbols-outlined">verified</span>
      )}
      {salvando ? CTA_SALVANDO : CTA_SALVAR}
    </button>
  );
};
