"use client";

import { useRouter } from "next/navigation";
import { BotaoCompartilharRole } from "@/app/(app)/feed/components/BotaoCompartilharRole";
import type { DadosConvite } from "@/lib/convite";
import { BADGE_LIDER, TITULO_TELA } from "../constants";
import styles from "../gerenciar-role.module.css";

type Props = {
  tituloRole: string;
  convite: DadosConvite;
};

export const CabecalhoGerenciar = ({ tituloRole, convite }: Props) => {
  const router = useRouter();

  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <button
          type="button"
          className={styles.botaoIcone}
          aria-label="Voltar"
          onClick={() => router.back()}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className={styles.cabecalhoTitulos}>
          <h1 className={styles.titulo}>{tituloRole || TITULO_TELA}</h1>
          <span className={styles.badge}>{BADGE_LIDER}</span>
        </div>
        <div className={styles.cabecalhoAcoes}>
          <BotaoCompartilharRole dados={convite} />
        </div>
      </div>
    </header>
  );
};
