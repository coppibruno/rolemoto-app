"use client";

import type { RoleFeedItem } from "@/types/role";
import { useCompartilharConvite } from "@/app/(publico)/r/[id]/hooks/useCompartilharConvite";
import styles from "../feed.module.css";

type Props = {
  role: RoleFeedItem;
};

export const BotaoCompartilharRole = ({ role }: Props) => {
  const { compartilhar, feedback } = useCompartilharConvite({
    id: role.id,
    titulo: role.titulo,
    dataHoraSaida: role.dataHoraSaida,
    localSaidaEndereco: role.localSaida.endereco,
  });

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
