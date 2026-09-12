import { mascararEmail } from "@/lib/mascarar-email";
import { COPY } from "../constants";
import styles from "../redefinir-senha.module.css";

type Props = {
  email: string;
};

export const CardHeroRedefinir = ({ email }: Props) => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden />
      <div className={styles.heroTopo}>
        <div className={styles.heroBadge}>
          <span className={`material-symbols-outlined ${styles.heroIcone}`}>
            lock_reset
          </span>
        </div>
        <div className={styles.heroTextos}>
          <span className={styles.pillSeguranca}>
            <span className={styles.pillPonto} aria-hidden />
            {COPY.pill}
          </span>
          <h1 className={styles.titulo}>{COPY.titulo}</h1>
          <p className={styles.subtitulo}>{COPY.subtitulo}</p>
        </div>
      </div>
      <div className={styles.chipEmail}>
        <span className="material-symbols-outlined">verified_user</span>
        <span>
          {COPY.chipEmail}{" "}
          <strong>{mascararEmail(email)}</strong>
        </span>
      </div>
    </section>
  );
};
