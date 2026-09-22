import styles from "../gerenciar-role.module.css";

export const EstadoCarregando = () => (
  <div className={styles.skeleton} aria-busy="true" aria-live="polite" />
);
