"use client";

import styles from "./faixa-stories.module.css";

type Props = {
  nome: string;
  fotoUrl: string;
  contagem: number;
  naoVisto: boolean;
  onAbrir: () => void;
};

export const AnelStory = ({ nome, fotoUrl, contagem, naoVisto, onAbrir }: Props) => (
  <button
    type="button"
    className={styles.anelItem}
    onClick={onAbrir}
    aria-label={`Fotos ao vivo de ${nome}, ${contagem}`}
  >
    <span className={`${styles.anelMoldura} ${naoVisto ? styles.anelNovo : ""}`}>
      {fotoUrl ? (
        <img src={fotoUrl} alt="" className={styles.anelFoto} />
      ) : (
        <span className={styles.anelVazio} />
      )}
    </span>
    <span className={styles.anelNome}>{nome}</span>
  </button>
);
