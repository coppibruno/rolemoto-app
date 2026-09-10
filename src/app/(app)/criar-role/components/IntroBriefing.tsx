import {
  INTRO_SUBTITULO,
  INTRO_SUBTITULO_CLONE,
  INTRO_TITULO,
  INTRO_TITULO_CLONE,
} from "../constants";
import styles from "../criar-role.module.css";

type Props = {
  modoClone?: boolean;
};

export const IntroBriefing = ({ modoClone }: Props) => {
  return (
    <div className={styles.intro}>
      <div className={styles.introTopo}>
        <div className={styles.introBriefing}>
          <span className={styles.pontoPulse} aria-hidden />
          <span className={styles.badgeBriefing}>Briefing Inicial</span>
        </div>
        <span className={styles.badgePasso}>Passo 1 de 1</span>
      </div>
      <h2 className={styles.introTitulo}>
        {modoClone ? INTRO_TITULO_CLONE : INTRO_TITULO}
      </h2>
      <p className={styles.introSubtitulo}>
        {modoClone ? INTRO_SUBTITULO_CLONE : INTRO_SUBTITULO}
      </p>
    </div>
  );
};
