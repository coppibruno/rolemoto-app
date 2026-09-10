"use client";

import styles from "../confirmacao-role.module.css";

type Props = {
  onClick: () => void;
};

export const BotaoVoltarFeed = ({ onClick }: Props) => {
  return (
    <button type="button" className={styles.botaoPrimario} onClick={onClick}>
      <span>Voltar ao Feed de Rolês</span>
      <span className="material-symbols-outlined">arrow_forward</span>
    </button>
  );
};
