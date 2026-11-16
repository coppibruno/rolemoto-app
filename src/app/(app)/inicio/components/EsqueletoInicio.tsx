import styles from "../inicio.module.css";

export const EsqueletoInicio = ({ compacto = false }: { compacto?: boolean }) => {
  if (compacto) {
    return <div className={styles.esqueletoLinha} aria-busy="true" />;
  }
  return (
    <div className={styles.lista} aria-busy="true">
      <div className={styles.esqueletoCard} />
      <div className={styles.esqueletoCard} />
      <div className={styles.esqueletoLinha} />
    </div>
  );
};
