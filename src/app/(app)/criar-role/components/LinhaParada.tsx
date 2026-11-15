"use client";

import { tituloLocal } from "@/lib/localizacao";
import type { Localizacao } from "@/types/role";
import styles from "../criar-role.module.css";

type Props = {
  ponto: Localizacao;
  indice: number;
  ultima: boolean;
  desabilitado?: boolean;
  onSubir: () => void;
  onDescer: () => void;
  onRemover: () => void;
};

export const LinhaParada = ({
  ponto,
  indice,
  ultima,
  desabilitado,
  onSubir,
  onDescer,
  onRemover,
}: Props) => {
  const titulo = tituloLocal(ponto);

  return (
    <li className={styles.linhaParada}>
      <span className={styles.numeroParada} aria-hidden>
        {indice + 1}
      </span>
      <span className={styles.tituloParada}>{titulo}</span>
      <button
        type="button"
        className={styles.botaoParada}
        onClick={onSubir}
        disabled={desabilitado || indice === 0}
        aria-label={`Subir ${titulo}`}
      >
        <span className="material-symbols-outlined">arrow_upward</span>
      </button>
      <button
        type="button"
        className={styles.botaoParada}
        onClick={onDescer}
        disabled={desabilitado || ultima}
        aria-label={`Descer ${titulo}`}
      >
        <span className="material-symbols-outlined">arrow_downward</span>
      </button>
      <button
        type="button"
        className={styles.botaoParada}
        onClick={onRemover}
        disabled={desabilitado}
        aria-label={`Remover ${titulo}`}
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </li>
  );
};
