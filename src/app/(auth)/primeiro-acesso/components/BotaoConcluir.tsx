"use client";

import { COPY } from "../constants";
import styles from "../primeiro-acesso.module.css";

type Props = {
  valido: boolean;
  salvando: boolean;
  sucesso: boolean;
};

export const BotaoConcluir = ({ valido, salvando, sucesso }: Props) => {
  const desabilitado = !valido || salvando || sucesso;

  return (
    <div className={styles.ctaBloco}>
      <button
        type="submit"
        className={`${styles.botaoConcluir} ${sucesso ? styles.botaoConcluirSucesso : ""}`}
        disabled={desabilitado}
      >
        {sucesso ? (
          <>
            <span className="material-symbols-outlined" aria-hidden>
              check_circle
            </span>
            {COPY.ctaSucesso}
          </>
        ) : salvando ? (
          <>
            <span className={`material-symbols-outlined ${styles.iconeGirando}`} aria-hidden>
              progress_activity
            </span>
            {COPY.ctaEnviando}
          </>
        ) : (
          <>
            {COPY.ctaIdle}
            {valido ? (
              <span className="material-symbols-outlined" aria-hidden>
                double_arrow
              </span>
            ) : null}
          </>
        )}
      </button>
      <div className={styles.rodape}>
        <span className="material-symbols-outlined" aria-hidden>
          lock_reset
        </span>
        <p>{COPY.rodape}</p>
      </div>
    </div>
  );
};
