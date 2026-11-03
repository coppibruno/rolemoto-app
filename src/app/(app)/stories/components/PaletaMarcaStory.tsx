"use client";

import styles from "./composer-story.module.css";

type Props = {
  temMarca: boolean;
  temLocal: boolean;
  onMarca: () => void;
  onLocal: () => void;
};

export const PaletaMarcaStory = ({ temMarca, temLocal, onMarca, onLocal }: Props) => (
  <div className={styles.paleta} role="group" aria-label="Marcações">
    <p className={styles.paletaTitulo}>Marcações</p>
    <button type="button" className={styles.opcao} onClick={onMarca} disabled={temMarca}>
      <span className="material-symbols-outlined" aria-hidden>
        alternate_email
      </span>
      {temMarca ? "Evento ou local · na foto" : "Evento ou local"}
    </button>
    <button type="button" className={styles.opcao} onClick={onLocal} disabled={temLocal}>
      <span className="material-symbols-outlined" aria-hidden>
        location_on
      </span>
      {temLocal ? "Localização · na foto" : "Localização"}
    </button>
  </div>
);
