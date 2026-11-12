"use client";

import { useTema } from "@/hooks/useTema";
import styles from "./botao-tema.module.css";

export const BotaoTema = () => {
  const { tema, alternar } = useTema();
  const claro = tema === "claro";

  return (
    <button
      type="button"
      className={styles.botao}
      aria-label={claro ? "Usar tema escuro" : "Usar tema claro"}
      aria-pressed={claro}
      onClick={alternar}
    >
      <span className="material-symbols-outlined" aria-hidden>
        {claro ? "dark_mode" : "light_mode"}
      </span>
    </button>
  );
};

export const LinhaTema = () => {
  const { tema, alternar } = useTema();
  const claro = tema === "claro";

  return (
    <button
      type="button"
      className={styles.linha}
      aria-pressed={claro}
      onClick={alternar}
    >
      <span className={styles.linhaIcone} aria-hidden>
        <span className="material-symbols-outlined">
          {claro ? "light_mode" : "dark_mode"}
        </span>
      </span>
      <span className={styles.linhaTextos}>
        <span className={styles.linhaTitulo}>Aparência</span>
        <span className={styles.linhaSub}>
          {claro ? "Tema claro" : "Tema escuro"}
        </span>
      </span>
      <span
        className={`${styles.trilho} ${claro ? styles.trilhoAtivo : ""}`}
        aria-hidden
      >
        <span className={styles.bolinha} />
      </span>
    </button>
  );
};
