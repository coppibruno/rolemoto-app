import styles from "../locais.module.css";

export const EstadoCarregandoLocais = () => {
  return (
    <div className={styles.lista} aria-busy="true" aria-live="polite">
      <div className={styles.skeleton} />
      <div className={styles.skeleton} />
    </div>
  );
};
