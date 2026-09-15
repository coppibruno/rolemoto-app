"use client";

import { useEffect } from "react";
import styles from "../meus-roles.module.css";

type Props = {
  visivel: boolean;
  mensagem: string;
  duracaoMs: number;
  onFechar: () => void;
};

export const ToastMeusRoles = ({
  visivel,
  mensagem,
  duracaoMs,
  onFechar,
}: Props) => {
  useEffect(() => {
    if (!visivel) return;
    const id = window.setTimeout(onFechar, duracaoMs);
    return () => window.clearTimeout(id);
  }, [visivel, duracaoMs, onFechar]);

  if (!visivel) return null;

  return (
    <div className={styles.toast} role="status">
      <span className="material-symbols-outlined">check_circle</span>
      <span>{mensagem}</span>
    </div>
  );
};
