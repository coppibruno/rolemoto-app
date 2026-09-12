import styles from "../meus-roles.module.css";

export const EstadoCarregandoMeusRoles = () => {
  return (
    <div className={styles.carregando} aria-busy="true" aria-live="polite">
      <div className={styles.skeleton} />
      <div className={styles.skeleton} />
    </div>
  );
};
