import styles from "../sugestoes-eventos.module.css";

export const EstadoCarregandoSugestoesEventos = () => {
  return (
    <div className={styles.lista} aria-busy="true" aria-live="polite">
      <div className={styles.skeleton} />
      <div className={styles.skeleton} />
    </div>
  );
};
