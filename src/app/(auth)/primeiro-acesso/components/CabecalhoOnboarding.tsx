import { COPY } from "../constants";
import styles from "../primeiro-acesso.module.css";

type Props = {
  percentual: number;
};

export const CabecalhoOnboarding = ({ percentual }: Props) => {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.kickerLinha}>
        <span className={styles.kicker}>
          <span className={styles.kickerPulso} aria-hidden />
          {COPY.kicker}
        </span>
        <span className={styles.percentual}>{percentual}% CONCLUÍDO</span>
      </div>
      <div
        className={styles.trilha}
        role="progressbar"
        aria-valuenow={percentual}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso do perfil"
      >
        <div className={styles.trilhaFill} style={{ width: `${percentual}%` }} />
      </div>
      <div className={styles.tituloLinha}>
        <span className={`material-symbols-outlined ${styles.tituloIcone}`} aria-hidden>
          two_wheeler
        </span>
        <h1 className={styles.titulo}>{COPY.titulo}</h1>
      </div>
      <p className={styles.subtitulo}>{COPY.subtitulo}</p>
    </header>
  );
};
