import Link from "next/link";
import styles from "../ranking.module.css";

type Props = {
  titulo: string;
  hrefVoltar: string;
};

export const CabecalhoRanking = ({ titulo, hrefVoltar }: Props) => (
  <header className={styles.cabecalho}>
    <Link href={hrefVoltar} className={styles.botaoVoltar} aria-label="Voltar">
      <span className="material-symbols-outlined">arrow_back</span>
    </Link>
    <h1 className={styles.titulo}>{titulo}</h1>
    <span className={styles.espaco} aria-hidden />
  </header>
);
