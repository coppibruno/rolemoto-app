import styles from "@/components/telemetria/telemetria.module.css";

type Props = {
  label: string;
  icone: string;
  disabled?: boolean;
  onClick: () => void;
};

export const BotaoControleGravacao = ({
  label,
  icone,
  disabled,
  onClick,
}: Props) => {
  return (
    <button
      type="button"
      className={styles.cta}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="material-symbols-outlined">{icone}</span>
      {label}
    </button>
  );
};
