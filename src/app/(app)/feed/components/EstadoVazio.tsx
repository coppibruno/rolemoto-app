"use client";

import { ESTADOS_VAZIOS } from "../constants";
import type { AbaFeed } from "../types";
import styles from "../feed.module.css";

type Props = {
  aba: AbaFeed;
};

export const EstadoVazio = ({ aba }: Props) => {
  const copy = ESTADOS_VAZIOS[aba];

  return (
    <div className={styles.vazio} role="status">
      <span className="material-symbols-outlined">explore_off</span>
      <p className={styles.vazioTitulo}>{copy.titulo}</p>
      <p className={styles.vazioTexto}>{copy.texto}</p>
    </div>
  );
};
