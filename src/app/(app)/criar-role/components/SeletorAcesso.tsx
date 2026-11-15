"use client";

import type { AcessoRole } from "@/types/role";
import { OPCOES_ACESSO } from "../constants";
import styles from "../criar-role.module.css";

type Props = {
  valor: AcessoRole;
  onChange: (valor: AcessoRole) => void;
  desabilitado?: boolean;
};

export const SeletorAcesso = ({ valor, onChange, desabilitado }: Props) => (
  <div className={styles.cartao}>
    <div className={styles.labelLinha}>
      <span className={styles.label} id="acesso-label">
        <span className="material-symbols-outlined" aria-hidden>
          lock_open
        </span>
        Quem entra
      </span>
    </div>
    <div className={styles.gradeAcesso} role="radiogroup" aria-labelledby="acesso-label">
      {OPCOES_ACESSO.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            className={`${styles.cardRitmo} ${styles.cardAcesso} ${ativo ? styles.cardAcessoAtivo : ""}`}
            onClick={() => onChange(opcao.valor)}
            disabled={desabilitado}
          >
            <span className={styles.cardRitmoLabel}>{opcao.label}</span>
            <span className={styles.cardRitmoSub}>{opcao.hint}</span>
          </button>
        );
      })}
    </div>
  </div>
);
