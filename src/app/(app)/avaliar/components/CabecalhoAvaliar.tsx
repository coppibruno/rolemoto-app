"use client";

import { KICKER_PAGINA, TITULO_PAGINA } from "../constants";
import styles from "../avaliar.module.css";

type Props = {
  onVoltar: () => void;
};

export const CabecalhoAvaliar = ({ onVoltar }: Props) => {
  return (
    <header className={styles.cabecalho}>
      <button
        type="button"
        className={styles.botaoIcone}
        aria-label="Voltar"
        onClick={onVoltar}
      >
        <span className="material-symbols-outlined" aria-hidden>
          arrow_back
        </span>
      </button>
      <div className={styles.cabecalhoCentro}>
        <h1 className={styles.tituloPagina}>{TITULO_PAGINA}</h1>
        <span className={styles.kicker}>
          <span className={styles.kickerPing} aria-hidden />
          {KICKER_PAGINA}
        </span>
      </div>
      <span className={`${styles.botaoIcone} ${styles.botaoIconeGhost}`} aria-hidden />
    </header>
  );
};
