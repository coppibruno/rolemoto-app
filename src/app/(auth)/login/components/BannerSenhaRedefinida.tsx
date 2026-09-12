"use client";

import { useState } from "react";
import styles from "../login.module.css";

export const BannerSenhaRedefinida = () => {
  const [visivel, setVisivel] = useState(true);
  if (!visivel) return null;

  return (
    <div className={styles.bannerSenha} role="status">
      <span className={`material-symbols-outlined ${styles.bannerSenhaIcone}`}>
        check_circle
      </span>
      <p className={styles.bannerSenhaTexto}>
        Senha redefinida. Entre com a nova senha.
      </p>
      <button
        type="button"
        className={styles.bannerSenhaFechar}
        onClick={() => setVisivel(false)}
        aria-label="Fechar aviso"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
};
