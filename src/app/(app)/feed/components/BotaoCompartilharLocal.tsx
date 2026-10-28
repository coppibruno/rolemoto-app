"use client";

import type { DadosConviteLocal } from "@/lib/convite-local";
import { useCompartilharLocal } from "@/app/(app)/locais/[id]/hooks/useCompartilharLocal";
import styles from "../feed.module.css";

type Props = {
  dados: DadosConviteLocal;
};

export const BotaoCompartilharLocal = ({ dados }: Props) => {
  const { compartilhar, feedback } = useCompartilharLocal(dados);

  return (
    <div className={styles.wrapCompartilhar}>
      <button
        type="button"
        className={styles.botaoCompartilhar}
        onClick={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          void compartilhar();
        }}
        aria-label="Compartilhar convite do local"
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
