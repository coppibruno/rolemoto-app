"use client";

import { useState } from "react";
import { formatarVelocidadeConquista, MAX_CONQUISTAS_VISIVEIS } from "@/lib/conquistas";
import type { ConquistaPerfil } from "@/types/conquista";
import styles from "../perfil-publico.module.css";

type Props = {
  conquistas: ConquistaPerfil[];
};

export const FaixaConquistas = ({ conquistas }: Props) => {
  const [expandido, setExpandido] = useState(false);
  if (conquistas.length === 0) return null;

  const visiveis = expandido ? conquistas : conquistas.slice(0, MAX_CONQUISTAS_VISIVEIS);
  const resto = conquistas.length - MAX_CONQUISTAS_VISIVEIS;

  return (
    <div className={styles.faixaSelos} aria-label="Conquistas do piloto">
      <span className={styles.selosRotulo}>Conquistas</span>
      <ul className={styles.listaSelos}>
        {visiveis.map((conquista) => (
          <li key={conquista.id} className={styles.itemConquista}>
            <span className={styles.chipConquista} title={conquista.nome}>
              <span className="material-symbols-outlined" aria-hidden>
                military_tech
              </span>
              <span className={styles.chipSeloNome}>{conquista.nome}</span>
              {typeof conquista.velocidadeMaxKmh === "number" ? (
                <span className={styles.chipConquistaVelocidade}>
                  {formatarVelocidadeConquista(conquista.velocidadeMaxKmh)}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {resto > 0 && !expandido ? (
        <button
          type="button"
          className={styles.botaoVerSelos}
          onClick={() => setExpandido(true)}
        >
          Ver conquistas
        </button>
      ) : null}
    </div>
  );
};
