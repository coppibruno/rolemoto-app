"use client";

import type { DadosConvite } from "@/lib/convite";
import { useCompartilharConvite } from "@/app/(publico)/r/[id]/hooks/useCompartilharConvite";
import styles from "../feed.module.css";

type Props = {
  dados: DadosConvite;
};

export const BotaoCompartilharRole = ({ dados }: Props) => {
  const { compartilhar, feedback } = useCompartilharConvite(dados);

  return (
    <div className={styles.wrapCompartilhar}>
      <button
        type="button"
        className={styles.botaoCompartilhar}
        onClick={compartilhar}
        aria-label="Compartilhar convite do rolê"
      >
        <span className="material-symbols-outlined" aria-hidden>
          share
        </span>
      </button>
      {feedback ? (
        <span className={styles.toastCopiado} role="status">
          {feedback}
        </span>
      ) : null}
    </div>
  );
};
