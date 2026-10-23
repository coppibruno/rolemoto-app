"use client";

import styles from "./composer-story.module.css";

type Props = {
  nome: string;
  travado: boolean;
  onTirar: () => void;
};

export const SeloLocalizacaoStory = ({ nome, travado, onTirar }: Props) => (
  <div className={styles.localizacao} role="group" aria-label={`Localização ${nome}`}>
    <span className="material-symbols-outlined" aria-hidden>
      location_on
    </span>
    <span className={styles.localizacaoNome}>{nome}</span>
    <button
      type="button"
      className={styles.tirar}
      aria-label="Tirar localização"
      disabled={travado}
      onClick={onTirar}
    >
      <span className="material-symbols-outlined" aria-hidden>
        close
      </span>
    </button>
  </div>
);
