"use client";

import type { AcessoEvento } from "@/types/evento";
import { OPCOES_ACESSO } from "../../criar-evento/constants";
import styles from "../sugestoes-eventos.module.css";

type Props = {
  valor: AcessoEvento;
  onChange: (valor: AcessoEvento) => void;
  desabilitado?: boolean;
};

export const ChipsAcessoEvento = ({ valor, onChange, desabilitado }: Props) => {
  return (
    <div className={styles.chips} role="radiogroup" aria-label="Acesso do evento">
      {OPCOES_ACESSO.map((opcao) => {
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
