import { INTRO_SUBTITULO, INTRO_TITULO } from "../constants";
import styles from "../criar-local.module.css";

export const IntroPainelAdmin = () => {
  return (
    <div className={styles.intro}>
      <span className={styles.badgeAdmin}>
        <span className={styles.pontoPulse} aria-hidden />
        Painel Admin
      </span>
      <h2 className={styles.introTitulo}>{INTRO_TITULO}</h2>
      <p className={styles.introSubtitulo}>{INTRO_SUBTITULO}</p>
    </div>
  );
};
