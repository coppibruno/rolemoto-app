"use client";

import type { RoleResumoSolicitacao } from "@/types/aprovacao";
import styles from "../aprovacoes.module.css";

type Props = {
  role: RoleResumoSolicitacao;
};

const rotuloConfirmados = (n: number): string =>
  n === 1 ? "1 confirmado" : `${n} confirmados`;

export const FaixaRoleCard = ({ role }: Props) => {
  return (
    <div className={styles.faixa}>
      <div className={styles.faixaRole}>
        <span className="material-symbols-outlined" aria-hidden>
          route
        </span>
        <span className={styles.faixaTitulo}>{role.titulo}</span>
      </div>
      <span className={styles.faixaConfirmados}>
        {rotuloConfirmados(role.confirmados)}
      </span>
    </div>
  );
};
