import Link from "next/link";
import styles from "../ofertas.module.css";

type Props = {
  titulo: string;
  hrefVoltar: string;
  acao?: { href: string; icone: string; label: string };
};

export const CabecalhoOfertas = ({ titulo, hrefVoltar, acao }: Props) => (
  <header className={styles.cabecalho}>
    <Link href={hrefVoltar} className={styles.botaoIcone} aria-label="Voltar">
      <span className="material-symbols-outlined">arrow_back</span>
    </Link>
    <h1 className={styles.titulo}>{titulo}</h1>
    {acao ? (
      <Link href={acao.href} className={styles.botaoIcone} aria-label={acao.label}>
        <span className="material-symbols-outlined">{acao.icone}</span>
      </Link>
    ) : (
      <span aria-hidden />
    )}
  </header>
);
