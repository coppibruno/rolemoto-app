import { FAIXA_CLONANDO } from "../constants";
import styles from "../criar-role.module.css";

type Props = {
  titulo: string;
};

export const FaixaClonando = ({ titulo }: Props) => {
  return (
    <div
      className={styles.faixaClonando}
      aria-label={`${FAIXA_CLONANDO}: ${titulo}`}
    >
      <div className={styles.faixaCabecalho}>
        <span className={styles.faixaBarra} aria-hidden />
        <span className={styles.faixaRotulo}>{FAIXA_CLONANDO}</span>
      </div>
      <p className={styles.faixaTituloOriginal}>{titulo}</p>
    </div>
  );
};
