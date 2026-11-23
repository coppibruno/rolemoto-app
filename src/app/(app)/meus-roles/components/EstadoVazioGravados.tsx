import { VAZIO_GRAVADOS } from "../constants";
import styles from "../meus-roles.module.css";

export const EstadoVazioGravados = () => {
  return (
    <div className={styles.vazio} role="status">
      <span className={`material-symbols-outlined ${styles.vazioIcone}`} aria-hidden>
        speed
      </span>
      <h2 className={styles.vazioTitulo}>{VAZIO_GRAVADOS.titulo}</h2>
      <p className={styles.vazioCorpo}>{VAZIO_GRAVADOS.corpo}</p>
    </div>
  );
};
