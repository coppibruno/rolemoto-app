"use client";

import { useState } from "react";
import Link from "next/link";
import {
  formatarVelocidadeConquista,
  hrefRanking,
  MAX_CONQUISTAS_VISIVEIS,
} from "@/lib/conquistas";
import type { ConquistaPerfil } from "@/types/conquista";
import styles from "../perfil-publico.module.css";

type Props = {
  conquistas: ConquistaPerfil[];
  /** No próprio perfil: botão Ranking e chip que abre o placar (SPEC 058). */
  proprio?: boolean;
};

export const FaixaConquistas = ({ conquistas, proprio = false }: Props) => {
  const [expandido, setExpandido] = useState(false);
  if (conquistas.length === 0 && !proprio) return null;

  const visiveis = expandido ? conquistas : conquistas.slice(0, MAX_CONQUISTAS_VISIVEIS);
  const resto = conquistas.length - MAX_CONQUISTAS_VISIVEIS;

  return (
    <div className={styles.faixaSelos} aria-label="Conquistas do piloto">
      <div className={styles.topoConquistas}>
        <span className={styles.selosRotulo}>Conquistas</span>
        {proprio ? (
          <Link href="/ranking" className={styles.botaoRanking}>
            <span className="material-symbols-outlined" aria-hidden>
              leaderboard
            </span>
            Ranking
          </Link>
        ) : null}
      </div>
      {visiveis.length > 0 ? (
        <ul className={styles.listaSelos}>
          {visiveis.map((conquista) => {
            const conteudo = (
              <>
                <span className="material-symbols-outlined" aria-hidden>
                  military_tech
                </span>
                <span className={styles.chipSeloNome}>{conquista.nome}</span>
                {typeof conquista.velocidadeMaxKmh === "number" ? (
                  <span className={styles.chipConquistaVelocidade}>
                    {formatarVelocidadeConquista(conquista.velocidadeMaxKmh)}
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={conquista.id} className={styles.itemConquista}>
                {proprio ? (
                  <Link
                    href={hrefRanking(conquista.id)}
                    className={`${styles.chipConquista} ${styles.chipConquistaLink}`}
                    title={conquista.nome}
                    aria-label={`Ranking de ${conquista.nome}`}
                  >
                    {conteudo}
                  </Link>
                ) : (
                  <span className={styles.chipConquista} title={conquista.nome}>
                    {conteudo}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
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
