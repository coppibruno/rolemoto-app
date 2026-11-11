"use client";

import { useId } from "react";
import { LIMITE_LEGENDA } from "@/types/post-foto";
import styles from "../nova-foto.module.css";

type Props = {
  valor: string;
  travado: boolean;
  onMudar: (valor: string) => void;
};

export const CampoLegenda = ({ valor, travado, onMudar }: Props) => {
  const id = useId();
  return (
    <div className={styles.campoLegenda}>
      <label htmlFor={id} className={styles.rotulo}>
        Legenda
      </label>
      <textarea
        id={id}
        className={styles.legenda}
        value={valor}
        rows={3}
        maxLength={LIMITE_LEGENDA}
        placeholder="Opcional"
        disabled={travado}
        onChange={(evento) => onMudar(evento.target.value)}
      />
      <span className={styles.contador} aria-live="polite">
        {valor.length}/{LIMITE_LEGENDA}
      </span>
    </div>
  );
};
