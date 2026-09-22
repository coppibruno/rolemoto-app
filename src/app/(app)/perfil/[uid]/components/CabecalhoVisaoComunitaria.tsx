"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCompartilharPerfil } from "../hooks/useCompartilharPerfil";
import styles from "../perfil-publico.module.css";

type Props = {
  uid: string;
  apelido: string;
};

export const CabecalhoVisaoComunitaria = ({ uid, apelido }: Props) => {
  const router = useRouter();
  const { usuario } = useAuth();
  const { compartilhar, feedback } = useCompartilharPerfil(uid, apelido);

  const voltar = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/aprovacoes");
  };

  return (
    <>
      <header className={styles.cabecalhoFaixa}>
        <button
          type="button"
          className={styles.botaoIcone}
          aria-label="Voltar"
          onClick={voltar}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className={styles.cabecalhoTitulos}>
          <span className={styles.kicker}>Visão Comunitária</span>
          <span className={styles.tituloCabecalho}>Perfil do Piloto</span>
        </div>
        <div className={styles.cabecalhoAcoes}>
          <button
            type="button"
            className={styles.botaoIcone}
            aria-label="Compartilhar perfil"
            onClick={() => void compartilhar()}
          >
            <span className="material-symbols-outlined">share</span>
          </button>
          <Link
            href="/perfil"
            className={styles.avatarVisitanteLink}
            aria-label="Ir para meu perfil"
          >
            {usuario?.fotoUrl ? (
              <img
                src={usuario.fotoUrl}
                alt=""
                className={styles.avatarVisitante}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className={styles.avatarVisitantePlaceholder} aria-hidden>
                <span className="material-symbols-outlined">account_circle</span>
              </span>
            )}
          </Link>
        </div>
      </header>
      {feedback ? (
        <div className={styles.toast} role="status">
          {feedback}
        </div>
      ) : null}
    </>
  );
};
