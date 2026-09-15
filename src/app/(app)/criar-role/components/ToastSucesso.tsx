"use client";

import {
  TOAST_SUBTITULO,
  TOAST_TITULO,
  TOAST_TITULO_CLONE,
  TOAST_TITULO_EDITAR,
} from "../constants";
import type { ModoCriarRole } from "../types";
import styles from "../criar-role.module.css";

type Props = {
  visivel: boolean;
  modo: ModoCriarRole;
};

const TITULOS: Record<ModoCriarRole, string> = {
  criar: TOAST_TITULO,
  clonar: TOAST_TITULO_CLONE,
  editar: TOAST_TITULO_EDITAR,
};

export const ToastSucesso = ({ visivel, modo }: Props) => {
  if (!visivel) return null;

  return (
    <div className={styles.toast} role="status">
      <div className={styles.toastIcone}>
        <span className="material-symbols-outlined">check_circle</span>
      </div>
      <div className={styles.toastTextos}>
        <span className={styles.toastTitulo}>{TITULOS[modo]}</span>
        <span className={styles.toastSubtitulo}>{TOAST_SUBTITULO}</span>
      </div>
    </div>
  );
};
