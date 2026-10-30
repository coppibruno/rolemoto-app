"use client";

import type { TipoEvento } from "@/types/evento";
import { OPCOES_TIPO } from "../../criar-evento/constants";
import styles from "../sugestoes-eventos.module.css";

type Props = {
  valor: TipoEvento;
  onChange: (valor: TipoEvento) => void;
  desabilitado?: boolean;
};

export const ChipsTipoEvento = ({ valor, onChange, desabilitado }: Props) => {
  return (
    <div className={styles.chips} role="radiogroup" aria-label="Tipo do evento">
      {OPCOES_TIPO.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            className={`${styles.chip} ${ativo ? styles.chipAtivo : ""}`}
            onClick={() => onChange(opcao.valor)}
            disabled={desabilitado}
          >
            {opcao.label}
          </button>
        );
      })}
    </div>
  );
};
