"use client";

import styles from "../nova-foto.module.css";

type Props = {
  ligado: boolean;
  travado: boolean;
  onMudar: (ligado: boolean) => void;
};

export const InterruptorStory = ({ ligado, travado, onMudar }: Props) => (
  <button
    type="button"
    role="switch"
    aria-checked={ligado}
    className={styles.interruptor}
    onClick={() => onMudar(!ligado)}
    disabled={travado}
  >
    <span className={styles.interruptorTexto}>
      <span>Também no story</span>
      <span className={styles.dica}>Uma cópia fica 24 h na sua bolinha</span>
    </span>
    <span className={ligado ? styles.trilhoLigado : styles.trilho} aria-hidden>
      <span className={styles.bolinha} />
    </span>
  </button>
);
