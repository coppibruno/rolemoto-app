"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AutorPost as Autor } from "@/types/post-foto";
import styles from "../post-foto.module.css";

type Props = {
  autorUid: string;
  autor?: Autor | null;
};

export const CabecalhoPost = ({ autorUid, autor }: Props) => {
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
      {autor ? (
        <Link
          href={`/perfil/${encodeURIComponent(autor.uid)}`}
          className={styles.autorTopo}
        >
          {autor.fotoUrl ? (
            <img
              src={autor.fotoUrl}
              alt=""
              className={styles.avatarTopo}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className={styles.avatarTopo} aria-hidden>
              <span className="material-symbols-outlined">account_circle</span>
            </span>
          )}
          <span className={styles.autorTopoNome}>{autor.apelido}</span>
        </Link>
      ) : (
        <span className={styles.espaco} aria-hidden />
      )}
      <span className={styles.espaco} aria-hidden />
    </header>
  );
};
