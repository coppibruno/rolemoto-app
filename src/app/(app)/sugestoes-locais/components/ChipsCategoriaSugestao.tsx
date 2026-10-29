"use client";

import type { CategoriaLocal } from "@/types/local";
import { OPCOES_CATEGORIA } from "../../locais/constants";
import styles from "../sugestoes-locais.module.css";

type Props = {
  valor: CategoriaLocal;
  onChange: (valor: CategoriaLocal) => void;
  desabilitado?: boolean;
};

export const ChipsCategoriaSugestao = ({ valor, onChange, desabilitado }: Props) => {
  return (
    <div className={styles.chips} role="radiogroup" aria-label="Categoria do local">
      {OPCOES_CATEGORIA.map((opcao) => {
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
