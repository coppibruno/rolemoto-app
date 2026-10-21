"use client";

import Link from "next/link";
import type { LocalDetalhe } from "@/types/local";
import {
  CHECKIN_AVALIAR,
  CHECKIN_FEITO,
  CHECKIN_PEDINDO_GPS,
  CTA_CHECKIN,
} from "../constants";
import { useCheckinLocal } from "../hooks/useCheckinLocal";
import styles from "../local-detalhe.module.css";

type Props = {
  local: LocalDetalhe;
};

export const BlocoCheckinLocal = ({ local }: Props) => {
  const { checkinProprio, processando, erro, seloNovo, marcar } =
    useCheckinLocal({ local });

  if (checkinProprio) {
    return (
      <section className={styles.blocoCheckin} aria-label="Presença">
        <p className={styles.chipCheckin}>
          <span className="material-symbols-outlined" aria-hidden>
            where_to_vote
          </span>
          {CHECKIN_FEITO}
        </p>
        {seloNovo ? (
          <p className={styles.textoCheckin}>Selo desbloqueado: {seloNovo}</p>
        ) : null}
        {!local.avaliado ? (
          <Link href={`/locais/${local.id}/avaliar`} className={styles.linkAvaliarCheckin}>
            {CHECKIN_AVALIAR}
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <section className={styles.blocoCheckin} aria-label="Marcar presença">
      <button
        type="button"
        className={styles.ctaCheckin}
        onClick={() => void marcar()}
        disabled={processando}
      >
        <span className="material-symbols-outlined" aria-hidden>
          my_location
        </span>
        {processando ? CHECKIN_PEDINDO_GPS : CTA_CHECKIN}
      </button>
      {erro ? (
        <p className={styles.erroCheckin} role="alert">
          {erro}
        </p>
      ) : null}
    </section>
  );
};
