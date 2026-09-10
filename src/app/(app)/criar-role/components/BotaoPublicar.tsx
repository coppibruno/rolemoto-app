"use client";

import styles from "../criar-role.module.css";

type Props = {
  publicando: boolean;
};

export const BotaoPublicar = ({ publicando }: Props) => {
  return (
    <button type="submit" className={styles.botaoPublicar} disabled={publicando}>
      {publicando ? (
        <span className={`material-symbols-outlined ${styles.girando}`}>
          autorenew
        </span>
      ) : (
        <span className="material-symbols-outlined">two_wheeler</span>
      )}
      {publicando ? "Publicando..." : "Publicar Rolê"}
    </button>
  );
};
