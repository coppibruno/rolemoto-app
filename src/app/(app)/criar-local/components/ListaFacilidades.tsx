"use client";

import type { FacilidadeLocal } from "@/types/local";
import { OPCOES_FACILIDADES } from "../constants";
import styles from "../criar-local.module.css";

type Props = {
  valores: FacilidadeLocal[];
  onAlternar: (valor: FacilidadeLocal) => void;
  desabilitado?: boolean;
};

export const ListaFacilidades = ({ valores, onAlternar, desabilitado }: Props) => {
  return (
    <div className={styles.cartao}>
      <span className={styles.label}>Estrutura & Facilidades Oferecidas</span>
      <span className={styles.hint}>
        Selecione as amenidades confirmadas pelo administrador
      </span>
      <div className={styles.listaFacilidades}>
        {OPCOES_FACILIDADES.map((opcao) => {
          const marcado = valores.includes(opcao.valor);
          return (
            <label key={opcao.valor} className={styles.itemFacilidade}>
              <input
                type="checkbox"
                checked={marcado}
                onChange={() => onAlternar(opcao.valor)}
                disabled={desabilitado}
              />
              <span className={styles.itemFacilidadeConteudo}>
                <span
                  className={`material-symbols-outlined ${styles.itemFacilidadeIcone}`}
                  aria-hidden
                >
                  {opcao.icone}
                </span>
                <span className={styles.itemFacilidadeLabel}>{opcao.label}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
