import { COPY } from "../constants";
import styles from "../primeiro-acesso.module.css";

export const CabecalhoOnboarding = () => {
  return (
    <header className={styles.cabecalho}>
      <h1 className={styles.titulo}>{COPY.titulo}</h1>
      <p className={styles.subtitulo}>{COPY.subtitulo}</p>
    </header>
  );
};
