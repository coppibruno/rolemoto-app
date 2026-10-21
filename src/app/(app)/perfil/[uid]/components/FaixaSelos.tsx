"use client";

import { useState } from "react";
import Link from "next/link";
import { iconeSelo, MAX_SELOS_VISIVEIS } from "@/lib/selos";
import type { SeloPublico } from "@/types/selo";
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
    <div className={styles.faixaSelos} aria-label="Paradas do piloto">
      <span className={styles.selosRotulo}>Paradas</span>
      <ul className={styles.listaSelos}>
        {visiveis.map((selo) => (
          <li key={selo.localId}>
            <Link
              href={`/locais/${selo.localId}`}
              className={styles.chipSelo}
              title={selo.nome}
            >
              <span className="material-symbols-outlined" aria-hidden>
                {iconeSelo(selo)}
              </span>
              <span className={styles.chipSeloNome}>{selo.nome}</span>
            </Link>
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
