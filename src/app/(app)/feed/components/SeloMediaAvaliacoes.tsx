"use client";

import styles from "../feed.module.css";

type Props = {
  notaMedia: number;
  totalAvaliacoes: number;
};

export const SeloMediaAvaliacoes = ({
  notaMedia,
  totalAvaliacoes,
}: Props) => {
  if (totalAvaliacoes <= 0) return null;

  const media = Number.isFinite(notaMedia) ? notaMedia.toFixed(1) : "0.0";

  return (
    <span
      className={styles.seloMedia}
      aria-label={`Média ${media} em ${totalAvaliacoes} avaliações`}
    >
      <span className="material-symbols-outlined" aria-hidden>
        star
      </span>
      {media}
      <span className={styles.seloMediaContagem}>({totalAvaliacoes})</span>
    </span>
  );
};
