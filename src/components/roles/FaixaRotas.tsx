"use client";

import { useState } from "react";
import type { RoleFixadoResumo } from "@/types/role";
import { FichaRota } from "./FichaRota";
import styles from "./faixa-rotas.module.css";

type Props = {
  rotas: RoleFixadoResumo[];
  /** No próprio perfil a faixa aparece mesmo vazia, com a dica de fixar. */
  proprio?: boolean;
};

export const FaixaRotas = ({ rotas, proprio = false }: Props) => {
  const [aberta, setAberta] = useState<string | null>(null);
  if (rotas.length === 0 && !proprio) return null;

  return (
    <div className={styles.faixa} aria-label="Rotas fixadas">
      <span className={styles.rotulo}>Rotas</span>
      {rotas.length === 0 ? (
        <p className={styles.dica}>Fixe um rolê para outros reutilizarem a rota.</p>
      ) : (
        <ul className={styles.lista}>
          {rotas.map((rota) => (
            <li key={rota.id}>
              <button type="button" className={styles.cartao} onClick={() => setAberta(rota.id)}>
                {rota.fotoCapaUrl ? (
                  <img src={rota.fotoCapaUrl} alt="" className={styles.capa} />
                ) : (
                  <span className={`${styles.capa} ${styles.capaVazia}`} aria-hidden>
                    <span className="material-symbols-outlined">route</span>
                  </span>
                )}
                <span className={styles.titulo}>{rota.titulo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {aberta ? <FichaRota roleId={aberta} onFechar={() => setAberta(null)} /> : null}
    </div>
  );
};
