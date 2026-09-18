"use client";

import type { AtracaoEvento } from "@/types/evento";
import { OPCOES_ATRACOES } from "../constants";
import styles from "../criar-evento.module.css";

type Props = {
  valores: AtracaoEvento[];
  onToggle: (valor: AtracaoEvento) => void;
  desabilitado?: boolean;
};

export const ListaAtracoes = ({ valores, onToggle, desabilitado }: Props) => {
  return (
    <div className={styles.cartao}>
      <div className={styles.labelLinha}>
        <span className={styles.label}>Estrutura & Atrações Disponíveis</span>
        <span className={styles.destaque}>Destaques</span>
      </div>
      {OPCOES_ATRACOES.map((opcao) => {
        const marcado = valores.includes(opcao.valor);
        return (
          <label
            key={opcao.valor}
            className={`${styles.linhaAtracao} ${
              marcado ? styles.linhaAtracaoAtiva : ""
            }`}
          >
            <span className={styles.linhaAtracaoTexto}>
              <span className="material-symbols-outlined" aria-hidden>
                {opcao.icone}
              </span>
              <span className={styles.linhaAtracaoLabel}>{opcao.label}</span>
            </span>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={marcado}
              onChange={() => onToggle(opcao.valor)}
              disabled={desabilitado}
            />
          </label>
        );
      })}
    </div>
  );
};
