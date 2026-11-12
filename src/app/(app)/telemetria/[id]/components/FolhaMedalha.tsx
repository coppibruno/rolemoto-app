"use client";

import Link from "next/link";
import { useFocoModal } from "@/hooks/useFocoModal";
import {
  formatarVelocidadeConquista,
  hrefRanking,
  LABEL_NOVIDADE_MEDALHA,
  medalhaEmDestaque,
} from "@/lib/conquistas";
import type { MedalhaTelemetria } from "@/types/conquista";
import styles from "./folha-medalha.module.css";

type Props = {
  medalha: MedalhaTelemetria;
  /** O número só aparece no passeio do próprio piloto. */
  mostrarVelocidade: boolean;
  onFechar: () => void;
};

export const FolhaMedalha = ({ medalha, mostrarVelocidade, onFechar }: Props) => {
  const cartaoRef = useFocoModal(onFechar);
  const velocidade =
    mostrarVelocidade && typeof medalha.velocidadeMaxKmh === "number"
      ? formatarVelocidadeConquista(medalha.velocidadeMaxKmh)
      : null;

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        ref={cartaoRef}
        className={styles.folha}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-folha-medalha"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={`material-symbols-outlined ${
            medalhaEmDestaque(medalha.novidade) ? styles.iconeDestaque : styles.iconeContorno
          }`}
          aria-hidden
        >
          military_tech
        </span>
        <h2 id="titulo-folha-medalha" className={styles.titulo}>
          {medalha.nome}
        </h2>
        <p className={styles.novidade}>{LABEL_NOVIDADE_MEDALHA[medalha.novidade]}</p>
        {velocidade ? <p className={styles.velocidade}>{velocidade}</p> : null}
        <div className={styles.acoes}>
          <Link
            href={hrefRanking(medalha.conquistaId)}
            className={styles.botaoPrimario}
            data-foco-inicial
          >
            <span className="material-symbols-outlined" aria-hidden>
              leaderboard
            </span>
            Ver ranking
          </Link>
          <button type="button" className={styles.botaoSecundario} onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
