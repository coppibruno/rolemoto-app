import styles from "../sugestoes-locais.module.css";

export const EstadoCarregandoSugestoes = () => {
  return (
    <div className={styles.lista} aria-busy="true" aria-live="polite">
      <div className={styles.skeleton} />
      <div className={styles.skeleton} />
    </div>
  );
};
