"use client";

import { ESTADOS_VAZIOS } from "../constants";
import type { AbaFeed, RaioKm } from "../types";
import styles from "../feed.module.css";

type Props = {
  aba: AbaFeed;
  raioKm?: RaioKm;
};

export const EstadoVazio = ({ aba, raioKm }: Props) => {
  const copy = ESTADOS_VAZIOS[aba];
  const texto = raioKm === null ? copy.textoSemLimite : copy.texto;

  return (
    <div className={styles.vazio} role="status">
      <span className="material-symbols-outlined">explore_off</span>
      <p className={styles.vazioTitulo}>{copy.titulo}</p>
      <p className={styles.vazioTexto}>{texto}</p>
    </div>
  );
};
