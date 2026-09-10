"use client";

import { TOAST_SUBTITULO, TOAST_TITULO, TOAST_TITULO_CLONE } from "../constants";
import styles from "../criar-role.module.css";

type Props = {
  visivel: boolean;
  modoClone?: boolean;
};

export const ToastSucesso = ({ visivel, modoClone }: Props) => {
  if (!visivel) return null;

  return (
    <div className={styles.toast} role="status">
      <div className={styles.toastIcone}>
        <span className="material-symbols-outlined">check_circle</span>
      </div>
      <div className={styles.toastTextos}>
        <span className={styles.toastTitulo}>
          {modoClone ? TOAST_TITULO_CLONE : TOAST_TITULO}
        </span>
        <span className={styles.toastSubtitulo}>{TOAST_SUBTITULO}</span>
      </div>
    </div>
  );
};
