import styles from "../perfil-publico.module.css";

export const EstadoCarregandoPublico = () => {
  return (
    <div className={styles.tela} aria-busy="true" aria-label="Carregando perfil">
      <div className={`${styles.skeleton} ${styles.skeletonCurto}`} />
      <div className={`${styles.skeleton} ${styles.skeletonMedio}`} />
      <div className={styles.skeleton} />
      <div className={styles.skeleton} />
      <div className={`${styles.skeleton} ${styles.skeletonAlto}`} />
    </div>
  );
};
