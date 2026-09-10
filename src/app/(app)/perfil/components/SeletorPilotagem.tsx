"use client";

import type { Pilotagem } from "@/types/user";
import { OPCOES_PILOTAGEM } from "../constants";
import styles from "../perfil.module.css";

type Props = {
  valor: Pilotagem | null;
  onChange: (valor: Pilotagem) => void;
  erro?: string;
  desabilitado?: boolean;
};

const iconePorValor: Record<Pilotagem, string> = {
  tranquila: styles.iconeTranquila,
  moderada: styles.iconeModerada,
  agressiva: styles.iconeAgressiva,
};

export const SeletorPilotagem = ({ valor, onChange, erro, desabilitado }: Props) => {
  return (
    <div className={styles.campo}>
      <span className={styles.label} id="label-pilotagem">
        Ritmo de Pilotagem
      </span>
      <div
        className={styles.gridPilotagem}
        role="radiogroup"
        aria-labelledby="label-pilotagem"
        aria-describedby={erro ? "pilotagem-erro" : undefined}
      >
        {OPCOES_PILOTAGEM.map((opcao) => {
          const selecionado = valor === opcao.valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              role="radio"
              aria-checked={selecionado}
              className={`${styles.cardPilotagem} ${selecionado ? styles.cardPilotagemAtivo : ""}`}
              onClick={() => onChange(opcao.valor)}
              disabled={desabilitado}
            >
              <span
                className={`material-symbols-outlined ${styles.iconePilotagem} ${iconePorValor[opcao.valor]}`}
              >
                {opcao.icone}
              </span>
              <span className={styles.cardPilotagemLabel}>{opcao.label}</span>
              <span className={styles.cardPilotagemSub}>{opcao.subtitulo}</span>
            </button>
          );
        })}
      </div>
      {erro ? (
        <p id="pilotagem-erro" className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
