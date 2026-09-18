"use client";

import type { TipoEvento } from "@/types/evento";
import { OPCOES_TIPO } from "../constants";
import styles from "../criar-evento.module.css";

type Props = {
  valor: TipoEvento | null;
  onChange: (valor: TipoEvento) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const SeletorTipoEvento = ({
  valor,
  onChange,
  erro,
  desabilitado,
}: Props) => {
  const erroId = "tipo-evento-erro";

  return (
    <div className={styles.campo}>
      <span className={styles.label} id="tipo-evento-label">
        Tipo de Evento <span className={styles.obrigatorio}>*</span>
      </span>
      <div
        className={styles.chips}
        role="radiogroup"
        aria-labelledby="tipo-evento-label"
        aria-describedby={erro ? erroId : undefined}
      >
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
              <span className="material-symbols-outlined" aria-hidden>
                {opcao.icone}
              </span>
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
