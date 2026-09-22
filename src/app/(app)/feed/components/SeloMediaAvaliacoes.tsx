"use client";

import Link from "next/link";
import styles from "../feed.module.css";

type Props = {
  notaMedia: number;
  totalAvaliacoes: number;
  href?: string;
};

export const SeloMediaAvaliacoes = ({
  notaMedia,
  totalAvaliacoes,
  href,
}: Props) => {
  if (totalAvaliacoes <= 0) return null;

  const media = Number.isFinite(notaMedia) ? notaMedia.toFixed(1) : "0.0";
  const rotulo = `Média ${media} em ${totalAvaliacoes} avaliações`;

  const conteudo = (
    <>
      <span className="material-symbols-outlined" aria-hidden>
        star
      </span>
      {media}
      <span className={styles.seloMediaContagem}>({totalAvaliacoes})</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${styles.seloMedia} ${styles.seloMediaLink}`}
        aria-label={rotulo}
        onClick={(evento) => evento.stopPropagation()}
      >
        {conteudo}
      </Link>
    );
  }

  return (
    <span className={styles.seloMedia} aria-label={rotulo}>
      {conteudo}
    </span>
  );
};
