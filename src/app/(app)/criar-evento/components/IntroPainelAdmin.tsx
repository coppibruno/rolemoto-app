import { INTRO_SUBTITULO, INTRO_TITULO } from "../constants";
import styles from "../criar-evento.module.css";

export const IntroPainelAdmin = () => {
  return (
    <section className={styles.intro}>
      <div className={styles.introGlow} aria-hidden />
      <div className={styles.introBadges}>
        <span className={styles.badgeAdmin}>
          <span className="material-symbols-outlined" aria-hidden>
            shield_person
          </span>
          Painel Admin
        </span>
        <span className={styles.badgeDestino}>Destino Fixo</span>
      </div>
      <h2 className={styles.introTitulo}>{INTRO_TITULO}</h2>
      <p className={styles.introSubtitulo}>{INTRO_SUBTITULO}</p>
    </section>
  );
};
