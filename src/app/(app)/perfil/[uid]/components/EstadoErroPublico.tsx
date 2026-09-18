"use client";

import { useRouter } from "next/navigation";
import { PILOTO_NAO_ENCONTRADO } from "../constants";
import styles from "../perfil-publico.module.css";

type Props = {
  mensagem?: string;
};

export const EstadoErroPublico = ({
  mensagem = PILOTO_NAO_ENCONTRADO,
}: Props) => {
  const router = useRouter();

  const voltar = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/aprovacoes");
  };

  return (
    <div className={styles.tela}>
      <div className={styles.cabecalho}>
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
        <span
          className={`${styles.botaoIcone} ${styles.botaoIconeEspaco}`}
          aria-hidden
        />
      </div>
      <div className={styles.estado} role="alert">
        <span className={`material-symbols-outlined ${styles.estadoIcone}`}>
          person_off
        </span>
        <p className={styles.estadoTitulo}>{mensagem}</p>
        <p className={styles.estadoCorpo}>
          Este piloto pode ter saído do Rolemoto ou o link está inválido.
        </p>
      </div>
    </div>
  );
};
