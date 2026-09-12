import Link from "next/link";
import { COPY } from "../constants";
import styles from "../redefinir-senha.module.css";

export const EstadoLinkInvalido = () => {
  return (
    <section className={styles.invalido}>
      <div className={styles.heroBadge}>
        <span className={`material-symbols-outlined ${styles.heroIcone}`}>
          link_off
        </span>
      </div>
      <p className={styles.invalidoTexto}>{COPY.linkInvalido}</p>
      <Link href="/login" className={styles.cta}>
        <span>{COPY.irAoLogin}</span>
        <span className="material-symbols-outlined">arrow_forward</span>
      </Link>
    </section>
  );
};
