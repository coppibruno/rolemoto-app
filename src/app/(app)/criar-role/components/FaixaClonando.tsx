import styles from "../criar-role.module.css";

type Props = {
  rotulo: string;
  titulo: string;
};

export const FaixaClonando = ({ rotulo, titulo }: Props) => {
  return (
    <div className={styles.faixaClonando} aria-label={`${rotulo}: ${titulo}`}>
      <div className={styles.faixaCabecalho}>
        <span className={styles.faixaBarra} aria-hidden />
        <span className={styles.faixaRotulo}>{rotulo}</span>
      </div>
      <p className={styles.faixaTituloOriginal}>{titulo}</p>
    </div>
  );
};
