"use client";

import { TOAST_SUBTITULO, TOAST_TITULO } from "../constants";
import styles from "../criar-local.module.css";

type Props = {
  visivel: boolean;
};

export const ToastSucesso = ({ visivel }: Props) => {
  if (!visivel) return null;

  return (
    <div className={styles.toast} role="status">
      <span className="material-symbols-outlined" aria-hidden>
        task_alt
      </span>
      <div className={styles.toastTextos}>
        <span className={styles.toastTitulo}>{TOAST_TITULO}</span>
        <span className={styles.toastSubtitulo}>{TOAST_SUBTITULO}</span>
      </div>
    </div>
  );
};
