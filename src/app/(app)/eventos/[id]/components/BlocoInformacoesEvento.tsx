import { TITULO_INFO } from "../constants";
import styles from "../evento-detalhe.module.css";

type Props = {
  texto: string;
};

export const BlocoInformacoesEvento = ({ texto }: Props) => {
  if (!texto.trim()) return null;

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitulo}>{TITULO_INFO}</h3>
      <p className={styles.informacoes}>{texto}</p>
    </section>
  );
};
