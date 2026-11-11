"use client";

import type { CapturaFoto } from "@/app/(app)/stories/hooks/useCapturaFoto";
import styles from "../nova-foto.module.css";

type Props = {
  captura: CapturaFoto;
};

export const EscolhaFoto = ({ captura }: Props) => (
  <div className={styles.escolha}>
    <button
      type="button"
      className={styles.opcaoFoto}
      onClick={captura.abrir}
      disabled={captura.preparando}
    >
      <span className="material-symbols-outlined" aria-hidden>
        photo_camera
      </span>
      Câmera
    </button>
    <button
      type="button"
      className={styles.opcaoFoto}
      onClick={captura.abrirGaleria}
      disabled={captura.preparando}
    >
      <span className="material-symbols-outlined" aria-hidden>
        photo_library
      </span>
      Galeria
    </button>
  </div>
);
