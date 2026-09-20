"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "./cabecalho-detalhe.module.css";

type Props = {
  titulo: string;
  onCompartilhar: () => void;
  feedback: string | null;
};

export const CabecalhoDetalhe = ({ titulo, onCompartilhar, feedback }: Props) => {
  const router = useRouter();
  const { usuario } = useAuth();
  const nome = usuario?.nome ?? "Perfil";
  const fotoUrl = usuario?.fotoUrl ?? "";

  return (
    <header className={styles.cabecalho}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.botao}
          aria-label="Voltar"
          onClick={() => router.back()}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className={styles.titulo}>{titulo}</h1>
        <div className={styles.acoes}>
          <button
            type="button"
            className={`${styles.botao} ${styles.botaoShare}`}
            aria-label="Compartilhar"
            onClick={onCompartilhar}
          >
            <span className="material-symbols-outlined">share</span>
          </button>
          <Link href="/perfil" className={styles.avatar} aria-label="Perfil">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={nome ? `Foto de ${nome}` : "Foto de perfil"}
                className={styles.avatarImg}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="material-symbols-outlined" aria-hidden>
                person
              </span>
            )}
          </Link>
        </div>
      </div>
      {feedback ? (
        <p className={styles.toast} role="status">
          {feedback}
        </p>
      ) : null}
    </header>
  );
};
