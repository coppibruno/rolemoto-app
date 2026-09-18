"use client";

import type { FiltroTipoHistorico } from "@/types/historico-pistas";
import { FILTROS_TIPO_HISTORICO } from "../constants";
import styles from "../historico-pistas.module.css";

type Props = {
  valor: FiltroTipoHistorico;
  onMudar: (valor: FiltroTipoHistorico) => void;
};

export const FiltroTipoHistoricoChips = ({ valor, onMudar }: Props) => {
  return (
    <div
      className={styles.filtroTipo}
      role="radiogroup"
      aria-label="Filtrar por tipo"
    >
      {FILTROS_TIPO_HISTORICO.map((opcao) => {
        const ativo = valor === opcao.id;
        return (
          <button
            key={opcao.id}
            type="button"
            role="radio"
            aria-checked={ativo}
            className={`${styles.chipFiltroTipo} ${ativo ? styles.chipFiltroTipoAtivo : ""}`}
            onClick={() => onMudar(opcao.id)}
          >
            {opcao.label}
          </button>
        );
      })}
    </div>
  );
};
