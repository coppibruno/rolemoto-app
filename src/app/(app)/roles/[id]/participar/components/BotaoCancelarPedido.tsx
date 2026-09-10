"use client";

import styles from "../confirmacao-role.module.css";

type Props = {
  disabled?: boolean;
  onClick: () => void;
};

export const BotaoCancelarPedido = ({ disabled, onClick }: Props) => {
  return (
    <button
      type="button"
      className={`${styles.botaoSecundario} ${styles.botaoCancelar}`}
      onClick={onClick}
      disabled={disabled}
      aria-label="Cancelar pedido de participação"
    >
      <span className="material-symbols-outlined">close</span>
      <span className={styles.labelSecundario}>Cancelar Pedido</span>
    </button>
  );
};
