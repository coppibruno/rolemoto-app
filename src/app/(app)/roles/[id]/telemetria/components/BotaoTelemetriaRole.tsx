"use client";

import styles from "../telemetria-role.module.css";

type Props = {
  label: string;
  disabled?: boolean;
  secundario?: boolean;
  onClick: () => void;
};

export const BotaoTelemetriaRole = ({
  label,
  disabled,
  secundario,
  onClick,
}: Props) => {
  return (
    <button
      type="button"
      className={secundario ? styles.botaoSecundario : styles.botao}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
