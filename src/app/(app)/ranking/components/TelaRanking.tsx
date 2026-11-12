"use client";

import Link from "next/link";
import { hrefRanking } from "@/lib/conquistas";
import { usePinosRanking } from "../hooks/usePinosRanking";
import { CabecalhoRanking } from "./CabecalhoRanking";
import styles from "../ranking.module.css";

export const TelaRanking = () => {
  const { pinos, carregando, erro, recarregar } = usePinosRanking();

  return (
    <div className={styles.tela}>
      <CabecalhoRanking titulo="Ranking" hrefVoltar="/perfil" />
      <p className={styles.intro}>
        Sua velocidade em cada ponto ao lado de quem você segue.
      </p>
      {carregando ? <p className={styles.aviso}>Carregando…</p> : null}
      {erro ? (
        <div className={styles.erro}>
          <p>{erro}</p>
          <button type="button" onClick={() => void recarregar()}>
            Tentar de novo
          </button>
        </div>
      ) : null}
      {!carregando && !erro && pinos.length === 0 ? (
        <p className={styles.aviso}>Nenhum ponto no ranking ainda</p>
      ) : null}
      {pinos.length > 0 ? (
        <ul className={styles.lista}>
          {pinos.map((pino) => (
            <li key={pino.id}>
              <Link href={hrefRanking(pino.id)} className={styles.linhaPino}>
                <span className={`material-symbols-outlined ${styles.iconePino}`} aria-hidden>
                  military_tech
                </span>
                <span className={styles.nomePino}>{pino.nome}</span>
                <span className="material-symbols-outlined" aria-hidden>
                  chevron_right
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
