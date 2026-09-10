"use client";

import styles from "../primeiro-acesso.module.css";

type Props = {
  valor: boolean;
  onChange: (valor: boolean) => void;
  desabilitado?: boolean;
};

export const ToggleGarupa = ({ valor, onChange, desabilitado }: Props) => {
  return (
    <div
      className={styles.toggle}
      role="radiogroup"
      aria-label="Possui garupa frequente"
    >
      <button
        type="button"
        role="radio"
        aria-checked={!valor}
        className={`${styles.toggleBtn} ${!valor ? styles.toggleBtnAtivo : ""}`}
        onClick={() => onChange(false)}
        disabled={desabilitado}
      >
        Não
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={valor}
        className={`${styles.toggleBtn} ${valor ? styles.toggleBtnAtivo : ""}`}
        onClick={() => onChange(true)}
        disabled={desabilitado}
      >
        Sim
      </button>
    </div>
  );
};
