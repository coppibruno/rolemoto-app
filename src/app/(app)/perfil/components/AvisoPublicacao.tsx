"use client";

import { useEffect, useState } from "react";
import { lerAvisoPublicacao } from "../aviso-publicacao";
import { TOAST_MS } from "../constants";
import styles from "../fotos-perfil.module.css";

export const AvisoPublicacao = () => {
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    setMensagem(lerAvisoPublicacao());
  }, []);

  useEffect(() => {
    if (!mensagem) return;
    const id = window.setTimeout(() => setMensagem(null), TOAST_MS * 2);
    return () => window.clearTimeout(id);
  }, [mensagem]);

  if (!mensagem) return null;

  return (
    <div className={styles.toast} role="status">
      <span>{mensagem}</span>
      <button
        type="button"
        className={styles.toastFechar}
        aria-label="Fechar aviso"
        onClick={() => setMensagem(null)}
      >
        <span className="material-symbols-outlined" aria-hidden>
          close
        </span>
      </button>
    </div>
  );
};
