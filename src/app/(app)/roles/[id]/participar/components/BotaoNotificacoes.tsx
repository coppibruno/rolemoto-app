"use client";

import styles from "../confirmacao-role.module.css";

type Props = {
  ligado: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export const BotaoNotificacoes = ({ ligado, disabled, onClick }: Props) => {
  return (
    <button
      type="button"
      className={styles.botaoSecundario}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ligado}
    >
      <span
        className={`material-symbols-outlined ${ligado ? styles.iconeOn : styles.iconeOff}`}
      >
        {ligado ? "notifications_active" : "notifications_off"}
      </span>
      <span className={styles.labelSecundario}>
        {ligado ? "Notificações On" : "Silenciado"}
      </span>
    </button>
  );
};
