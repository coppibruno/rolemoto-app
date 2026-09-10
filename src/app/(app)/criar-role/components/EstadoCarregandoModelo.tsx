import styles from "../criar-role.module.css";

export const EstadoCarregandoModelo = () => {
  return (
    <div
      className={styles.esqueletoModelo}
      role="status"
      aria-label="Carregando rota original"
    >
      <div className={styles.esqueletoCartao} />
      <div className={styles.esqueletoCartao} />
      <div className={styles.esqueletoCartao} />
    </div>
  );
};
