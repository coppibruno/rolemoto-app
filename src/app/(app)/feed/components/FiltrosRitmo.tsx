"use client";

import { OPCOES_RITMO } from "../constants";
import type { FiltroRitmo } from "../types";
import styles from "../feed.module.css";

type Props = {
  valor: FiltroRitmo;
  onChange: (valor: FiltroRitmo) => void;
};

const classeBolinha: Record<Exclude<FiltroRitmo, "todas">, string> = {
  tranquila: styles.bolinhaTranquila,
  moderada: styles.bolinhaModerada,
  agressiva: styles.bolinhaAgressiva,
};

export const FiltrosRitmo = ({ valor, onChange }: Props) => {
  return (
    <div className={styles.chipsGrupo} role="group" aria-label="Ritmo de pilotagem">
      {OPCOES_RITMO.map((opcao) => {
        const ativo = valor === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={ativo}
            className={`${styles.chip} ${ativo ? styles.chipAtivo : ""}`}
            onClick={() => onChange(ativo ? "todas" : opcao.valor)}
          >
            <span className={`${styles.bolinha} ${classeBolinha[opcao.valor]}`} aria-hidden />
            {opcao.label}
          </button>
        );
      })}
    </div>
  );
};
