"use client";

import type { MencaoOpcao } from "@/app/(app)/stories/hooks/usePublicarStoryPerfil";
import styles from "../nova-foto.module.css";

type Props = {
  marca: MencaoOpcao | null;
  travado: boolean;
  onMarcar: () => void;
  onTirar: () => void;
};

export const MarcaNovaFoto = ({ marca, travado, onMarcar, onTirar }: Props) => {
  if (!marca) {
    return (
      <button type="button" className={styles.marcar} onClick={onMarcar} disabled={travado}>
        <span className="material-symbols-outlined" aria-hidden>
          sell
        </span>
        Marcar
      </button>
    );
  }
  return (
    <div className={styles.chip}>
      <span className="material-symbols-outlined" aria-hidden>
        {marca.tipo === "local" ? "location_on" : "event"}
      </span>
      <span className={styles.chipNome}>@{marca.nome}</span>
      <button type="button" className={styles.tirar} onClick={onTirar} disabled={travado}>
        Tirar
      </button>
    </div>
  );
};
