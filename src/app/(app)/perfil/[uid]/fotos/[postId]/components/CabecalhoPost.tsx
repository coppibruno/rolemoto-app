"use client";

import { useRouter } from "next/navigation";
import styles from "../post-foto.module.css";

type Props = {
  autorUid: string;
};

export const CabecalhoPost = ({ autorUid }: Props) => {
  const router = useRouter();

  const voltar = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/perfil/${encodeURIComponent(autorUid)}`);
  };

  return (
    <header className={styles.cabecalho}>
      <button type="button" className={styles.voltar} aria-label="Voltar" onClick={voltar}>
        <span className="material-symbols-outlined" aria-hidden>
          arrow_back
        </span>
      </button>
      <h1 className={styles.titulo}>Foto</h1>
      <span className={styles.espaco} aria-hidden />
    </header>
  );
};
