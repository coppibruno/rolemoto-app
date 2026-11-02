import styles from "./player-stories.module.css";

type Props = {
  rotulo?: string;
};

export const EsqueletoFotoStory = ({ rotulo = "Carregando foto" }: Props) => (
  <div className={styles.esqueleto} role="status">
    <span className={styles.brilho} aria-hidden />
    <span className={styles.anel} aria-hidden />
    <p className={styles.legenda}>{rotulo}</p>
  </div>
);
