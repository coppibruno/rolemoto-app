import styles from "../convite-role.module.css";

type Props = {
  label: string;
  subtitulo: string | null;
  disabled: boolean;
  onClick: () => void;
};

export const BotaoParticiparConvite = ({
  label,
  subtitulo,
  disabled,
  onClick,
}: Props) => {
  return (
    <button
      type="button"
      className={styles.cta}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      <span className={styles.ctaLabel}>{label}</span>
      {subtitulo ? <span className={styles.ctaSub}>{subtitulo}</span> : null}
    </button>
  );
};
