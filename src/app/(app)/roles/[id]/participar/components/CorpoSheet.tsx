"use client";

import { COPY_SHEET } from "../constants";
import type { EstadoSheet } from "../types";
import styles from "../confirmacao-role.module.css";

type EstadoDialogo = Exclude<EstadoSheet, "organizador">;

type Props = {
  estado: EstadoDialogo;
  apelido: string;
};

export const CorpoSheet = ({ estado, apelido }: Props) => {
  const handle = `@${apelido}`;
  const texto = COPY_SHEET[estado].corpo(apelido);
  const [antes, depois] = texto.split(handle);

  return (
    <p className={styles.sheetCorpo}>
      {antes}
      <span className={styles.apelido}>{handle}</span>
      {depois}
    </p>
  );
};
