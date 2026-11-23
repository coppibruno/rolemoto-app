"use client";

import type { AlvoArquivoGaragem } from "../hooks/useArquivoGaragem";
import styles from "../meus-roles.module.css";

type Props = {
  alvo: Exclude<AlvoArquivoGaragem, { tipo: "telemetria" }>;
  ocupado: boolean;
  onRemover: (alvo: AlvoArquivoGaragem) => void;
};

export const BotaoRemoverDaLista = ({ alvo, ocupado, onRemover }: Props) => {
  const rotulo =
    alvo.tipo === "evento"
      ? `Remover evento ${alvo.titulo} da lista`
      : `Remover rolê ${alvo.titulo} da lista`;

  return (
    <button
      type="button"
      className={styles.botaoRemoverLista}
      aria-label={rotulo}
      disabled={ocupado}
      onClick={() => onRemover(alvo)}
    >
      <span className="material-symbols-outlined" aria-hidden>
        playlist_remove
      </span>
      Remover da lista
    </button>
  );
};
