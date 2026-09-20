import styles from "@/components/telemetria/telemetria.module.css";

type Props = {
  label: string;
  hint: string;
  gravando?: boolean;
};

export const StatusGravacao = ({ label, hint, gravando }: Props) => {
  return (
    <div className={styles.statusEsquerda}>
      <div className={styles.iconeGps}>
        <span className="material-symbols-outlined">my_location</span>
        {gravando ? <span className={styles.ping} aria-hidden /> : null}
      </div>
      <div className={styles.statusTextos}>
        <div className={styles.badgeStatus}>
          <span className={styles.pontoStatus} aria-hidden />
          {label}
        </div>
        <span className={styles.statusHint}>{hint}</span>
      </div>
    </div>
  );
};
