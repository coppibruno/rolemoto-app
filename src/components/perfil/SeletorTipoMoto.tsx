"use client";

import type { TipoMoto } from "@/types/user";
import { OPCOES_TIPO_MOTO } from "./constants-tipo-moto";
import styles from "./seletor-tipo-moto.module.css";

type Props = {
  valor: TipoMoto | null;
  onChange: (valor: TipoMoto) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const SeletorTipoMoto = ({
  valor,
  onChange,
  erro,
  desabilitado,
}: Props) => {
  return (
    <div className={styles.campo}>
      <span className={styles.label} id="label-tipo-moto">
        Tipo de Moto
        <span className={styles.hint}>obrigatório</span>
      </span>
      <div
        className={styles.grid}
        role="radiogroup"
        aria-labelledby="label-tipo-moto"
        aria-describedby={erro ? "tipo-moto-erro" : undefined}
        aria-invalid={erro ? true : undefined}
      >
        {OPCOES_TIPO_MOTO.map((opcao) => {
          const selecionado = valor === opcao.valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              role="radio"
              aria-checked={selecionado}
              className={`${styles.card} ${selecionado ? styles.cardAtivo : ""}`}
              onClick={() => onChange(opcao.valor)}
              disabled={desabilitado}
            >
              <span className={`material-symbols-outlined ${styles.icone}`}>
                {opcao.icone}
              </span>
              <span className={styles.labelCard}>{opcao.label}</span>
            </button>
          );
        })}
      </div>
      {erro ? (
        <p id="tipo-moto-erro" className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
