"use client";

import type { CategoriaLocal } from "@/types/local";
import { OPCOES_CATEGORIA } from "../constants";
import styles from "../criar-local.module.css";

type Props = {
  valor: CategoriaLocal | null;
  onChange: (valor: CategoriaLocal) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const SeletorCategoriaLocal = ({
  valor,
  onChange,
  erro,
  desabilitado,
}: Props) => {
  const erroId = "categoria-local-erro";

  return (
    <div className={`${styles.cartao} ${erro ? styles.cartaoErro : ""}`}>
      <span className={styles.label} id="categoria-local-label">
        Categoria do Local *
      </span>
      <div
        className={styles.chips}
        role="radiogroup"
        aria-labelledby="categoria-local-label"
        aria-describedby={erro ? erroId : undefined}
      >
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
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
