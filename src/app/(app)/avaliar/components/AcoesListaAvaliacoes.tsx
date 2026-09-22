"use client";

import Link from "next/link";
import type { TipoAlvoAvaliacao } from "@/types/avaliacao-experiencia";
import {
  CTA_AVALIAR,
  CTA_EDITAR_MINHA,
  CTA_VOLTAR_FEED,
} from "../constants";
import styles from "../avaliar.module.css";

type Props = {
  tipo: TipoAlvoAvaliacao;
  alvoId: string;
  temMinha: boolean;
  podeAvaliar: boolean;
  onVoltarFeed: () => void;
};

export const AcoesListaAvaliacoes = ({
  tipo,
  alvoId,
  temMinha,
  podeAvaliar,
  onVoltarFeed,
}: Props) => {
  const base =
    tipo === "local" ? `/locais/${alvoId}/avaliar` : `/eventos/${alvoId}/avaliar`;

  return (
    <div className={styles.acoes}>
      {temMinha ? (
        <Link href={base} className={styles.ctaPrimario}>
          <span>{CTA_EDITAR_MINHA}</span>
          <span className="material-symbols-outlined" aria-hidden>
            edit
          </span>
        </Link>
      ) : podeAvaliar ? (
        <Link href={base} className={styles.ctaPrimario}>
          <span>{CTA_AVALIAR}</span>
          <span className="material-symbols-outlined" aria-hidden>
            star
          </span>
        </Link>
      ) : null}
      <button
        type="button"
        className={styles.ctaSecundario}
        onClick={onVoltarFeed}
      >
        {CTA_VOLTAR_FEED}
      </button>
    </div>
  );
};
