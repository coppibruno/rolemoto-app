"use client";

import type { AlvoApagarHistorico } from "../hooks/useApagarHistorico";
import styles from "../historico-pistas.module.css";

type Props = {
  alvo: AlvoApagarHistorico;
  ocupado: boolean;
  onApagar: (alvo: AlvoApagarHistorico) => void;
};

const ariaDe = (alvo: AlvoApagarHistorico): string => {
  if (alvo.tipo === "telemetria") return `Apagar passeio ${alvo.titulo}`;
  if (alvo.tipo === "evento") return `Remover evento ${alvo.titulo} do histórico`;
  return `Remover rolê ${alvo.titulo} do histórico`;
};

export const BotaoApagarHistorico = ({ alvo, ocupado, onApagar }: Props) => {
  return (
    <button
      type="button"
      className={styles.botaoApagar}
      aria-label={ariaDe(alvo)}
      disabled={ocupado}
      onClick={() => onApagar(alvo)}
    >
      <span className="material-symbols-outlined" aria-hidden>
        delete
      </span>
    </button>
  );
};
