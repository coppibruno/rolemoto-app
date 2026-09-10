"use client";

import { useEffect } from "react";
import { TOAST_MS } from "../constants";
import styles from "../perfil.module.css";

type Props = {
  visivel: boolean;
  onFechar: () => void;
};

export const ToastSucesso = ({ visivel, onFechar }: Props) => {
  useEffect(() => {
    if (!visivel) return;
    const id = window.setTimeout(onFechar, TOAST_MS);
    return () => window.clearTimeout(id);
  }, [visivel, onFechar]);

  if (!visivel) return null;

  return (
    <div className={styles.toast} role="status">
      <div className={styles.toastConteudo}>
        <span className="material-symbols-outlined">check_circle</span>
        <span>Perfil atualizado com sucesso no Cockpit!</span>
      </div>
      <button
        type="button"
        className={styles.toastFechar}
        onClick={onFechar}
        aria-label="Fechar notificação"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
};
