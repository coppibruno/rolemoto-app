"use client";

import { COPY } from "../constants";
import styles from "../primeiro-acesso.module.css";

type Props = {
  valido: boolean;
  ocupado: boolean;
};

export const BotaoConcluir = ({ valido, ocupado }: Props) => {
  return (
    <div className={styles.ctaBloco}>
      <button
        type="submit"
        className={styles.botaoConcluir}
        disabled={!valido || ocupado}
      >
        {ocupado ? (
          <>
            <span className={`material-symbols-outlined ${styles.iconeGirando}`} aria-hidden>
              progress_activity
            </span>
            {COPY.ctaEnviando}
          </>
        ) : (
          COPY.ctaIdle
        )}
      </button>
      <p className={styles.rodape}>{COPY.rodape}</p>
    </div>
  );
};
