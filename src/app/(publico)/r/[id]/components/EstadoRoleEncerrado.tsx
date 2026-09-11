import { COPY_CTA, COPY_ENCERRADO } from "../constants";
import styles from "../convite-role.module.css";

export const EstadoRoleEncerrado = () => {
  return (
    <button
      type="button"
      className={styles.cta}
      disabled
      aria-disabled="true"
    >
      <span className={styles.ctaLabel}>{COPY_CTA}</span>
      <span className={styles.ctaSub}>{COPY_ENCERRADO}</span>
    </button>
  );
};
