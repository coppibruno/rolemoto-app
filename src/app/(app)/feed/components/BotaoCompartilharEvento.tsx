"use client";

import type { DadosConviteEvento } from "@/lib/convite-evento";
import { useCompartilharEvento } from "@/app/(app)/eventos/[id]/hooks/useCompartilharEvento";
import styles from "../feed.module.css";

type Props = {
  dados: DadosConviteEvento;
};

export const BotaoCompartilharEvento = ({ dados }: Props) => {
  const { compartilhar, feedback } = useCompartilharEvento(dados);

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
        aria-label="Compartilhar convite do evento"
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
