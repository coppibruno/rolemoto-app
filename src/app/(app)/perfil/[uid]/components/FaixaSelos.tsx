"use client";

import { useState } from "react";
import { ICONES_SELO, MAX_SELOS_VISIVEIS } from "@/lib/selos";
import type { SeloId, SeloPublico } from "@/types/selo";
import styles from "../perfil-publico.module.css";

type Props = {
  selos: SeloPublico[];
};

export const FaixaSelos = ({ selos }: Props) => {
  const [expandido, setExpandido] = useState(false);
  if (selos.length === 0) return null;

  const visiveis = expandido ? selos : selos.slice(0, MAX_SELOS_VISIVEIS);
  const resto = selos.length - MAX_SELOS_VISIVEIS;

  return (
    <div className={styles.faixaSelos} aria-label="Selos do piloto">
      <span className={styles.selosRotulo}>Selos</span>
      <ul className={styles.listaSelos}>
        {visiveis.map((selo) => (
          <li key={selo.id} className={styles.chipSelo}>
            <span className="material-symbols-outlined" aria-hidden>
              {ICONES_SELO[selo.id as SeloId] ?? "military_tech"}
            </span>
            {selo.label}
          </li>
        ))}
      </ul>
      {resto > 0 && !expandido ? (
        <button
          type="button"
          className={styles.botaoVerSelos}
          onClick={() => setExpandido(true)}
        >
          Ver selos
        </button>
      ) : null}
    </div>
  );
};
