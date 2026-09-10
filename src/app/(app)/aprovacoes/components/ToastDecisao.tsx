"use client";

import { useEffect } from "react";
import { TOAST_MS } from "../constants";
import type { ToastDecisaoEstado } from "../hooks/useDecisaoPiloto";
import styles from "../aprovacoes.module.css";

type Props = {
  toast: ToastDecisaoEstado | null;
  onFechar: () => void;
};

const iconeDe = (tipo: ToastDecisaoEstado["tipo"]) => {
  if (tipo === "aceite") return "check_circle";
  if (tipo === "recusa") return "do_not_disturb_on";
  return "error";
};

const classeDe = (tipo: ToastDecisaoEstado["tipo"]) => {
  if (tipo === "aceite") return styles.toastAceite;
  if (tipo === "recusa") return styles.toastRecusa;
  return styles.toastErro;
};

export const ToastDecisao = ({ toast, onFechar }: Props) => {
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(onFechar, TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast, onFechar]);

  if (!toast) return null;

  const role = toast.tipo === "erro" ? "alert" : "status";

  return (
    <div className={`${styles.toast} ${classeDe(toast.tipo)}`} role={role}>
      <span className="material-symbols-outlined" aria-hidden>
        {iconeDe(toast.tipo)}
      </span>
      <span className={styles.toastMsg}>{toast.mensagem}</span>
    </div>
  );
};
