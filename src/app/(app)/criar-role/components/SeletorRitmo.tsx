"use client";

import type { RitmoRole } from "@/types/role";
import { OPCOES_RITMO } from "../constants";
import styles from "../criar-role.module.css";

type Props = {
  valor: RitmoRole;
  onChange: (valor: RitmoRole) => void;
  erro?: string;
  desabilitado?: boolean;
};

const classeAtivo: Record<RitmoRole, string> = {
  tranquila: styles.cardRitmoTranquila,
  moderada: styles.cardRitmoModerada,
  agressiva: styles.cardRitmoAgressiva,
};

export const SeletorRitmo = ({ valor, onChange, erro, desabilitado }: Props) => {
  const hint = OPCOES_RITMO.find((opcao) => opcao.valor === valor)?.hint;
  const erroId = "ritmo-erro";

  return (
    <div className={`${styles.cartao} ${erro ? styles.cartaoErro : ""}`}>
      <div className={styles.labelLinha}>
        <span className={styles.label} id="ritmo-label">
          <span className="material-symbols-outlined" aria-hidden>
            speed
          </span>
          Ritmo da Tocada
        </span>
        {hint ? <span className={styles.hintRitmo}>{hint}</span> : null}
      </div>
      <div
        className={styles.gradeRitmo}
        role="radiogroup"
        aria-labelledby="ritmo-label"
        aria-describedby={erro ? erroId : undefined}
      >
        {OPCOES_RITMO.map((opcao) => {
          const ativo = opcao.valor === valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              role="radio"
              aria-checked={ativo}
              className={`${styles.cardRitmo} ${ativo ? classeAtivo[opcao.valor] : ""}`}
              onClick={() => onChange(opcao.valor)}
              disabled={desabilitado}
            >
              <span className={styles.cardRitmoLabel}>{opcao.label}</span>
              <span className={styles.cardRitmoSub}>{opcao.subtitulo}</span>
            </button>
          );
        })}
      </div>
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
