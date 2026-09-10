"use client";

import Link from "next/link";
import type { ResumoAprovacoes, StatusAprovacao } from "@/types/aprovacao";
import {
  EMPTY_CONFIRMADOS,
  EMPTY_ORGANIZADO_TEXTO,
  EMPTY_ORGANIZADO_TITULO,
  EMPTY_SEM_HISTORICO,
} from "../constants";
import styles from "../aprovacoes.module.css";

type Props = {
  status: StatusAprovacao;
  resumo: ResumoAprovacoes;
};

type Variante = "organizado" | "sem-historico" | "confirmados";

const resolverVariante = (
  status: StatusAprovacao,
  resumo: ResumoAprovacoes,
): Variante => {
  if (status === "aceito") return "confirmados";
  if (resumo.aceitos > 0) return "organizado";
  return "sem-historico";
};

export const EstadoVazio = ({ status, resumo }: Props) => {
  const variante = resolverVariante(status, resumo);

  if (variante === "confirmados") {
    return (
      <div className={styles.vazio} role="status">
        <div className={styles.vazioIcone}>
          <span className="material-symbols-outlined">group_off</span>
        </div>
        <p className={styles.vazioTexto}>{EMPTY_CONFIRMADOS}</p>
      </div>
    );
  }

  if (variante === "sem-historico") {
    return (
      <div className={styles.vazio} role="status">
        <div className={styles.vazioIcone}>
          <span className="material-symbols-outlined">two_wheeler</span>
        </div>
        <p className={styles.vazioTexto}>{EMPTY_SEM_HISTORICO}</p>
      </div>
    );
  }

  return (
    <div className={styles.vazio} role="status">
      <div className={styles.vazioIcone}>
        <span className="material-symbols-outlined">task_alt</span>
      </div>
      <h2 className={styles.vazioTitulo}>{EMPTY_ORGANIZADO_TITULO}</h2>
      <p className={styles.vazioTexto}>{EMPTY_ORGANIZADO_TEXTO}</p>
      <Link href="/" className={styles.vazioCta}>
        Voltar para os Rolês
      </Link>
    </div>
  );
};
