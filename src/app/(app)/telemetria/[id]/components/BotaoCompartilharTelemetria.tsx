"use client";

import styles from "@/components/telemetria/telemetria.module.css";

type Props = {
  ocupado: boolean;
  onCompartilhar: () => void;
};

export const BotaoCompartilharTelemetria = ({ ocupado, onCompartilhar }: Props) => {
  return (
    <button
      type="button"
      className={styles.cta}
      disabled={ocupado}
      aria-busy={ocupado}
      onClick={onCompartilhar}
    >
      <span className="material-symbols-outlined">ios_share</span>
      {ocupado ? "Preparando imagem…" : "Compartilhar"}
    </button>
  );
};
