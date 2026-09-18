"use client";

import Link from "next/link";
import type { ItemHistoricoRole } from "@/types/historico-pistas";
import {
  ariaCardHistorico,
  hrefCardHistoricoRole,
  LINHA1_LIDER,
  STATUS_DIREITA,
} from "../constants";
import { formatarDataMeta } from "../formatar-data-historico";
import { BlocoDataHistorico } from "./BlocoDataHistorico";
import { BotaoClonarRole } from "./BotaoClonarRole";
import styles from "../historico-pistas.module.css";

type Props = {
  item: ItemHistoricoRole;
};

const classeTitulo: Record<ItemHistoricoRole["status"], string> = {
  pendente: styles.tituloPendente,
  confirmado: styles.tituloConfirmado,
  concluido: styles.tituloConcluido,
  lider: styles.tituloLider,
};

const classeStatus: Record<ItemHistoricoRole["status"], string> = {
  pendente: styles.chipAnalise,
  confirmado: styles.statusConfirmado,
  concluido: styles.statusConcluido,
  lider: styles.statusLider,
};

export const CardHistorico = ({ item }: Props) => {
  const linha1 = item.status === "lider" ? LINHA1_LIDER : item.titulo;
  const linha2 = item.status === "lider" ? item.titulo : item.descricao.trim();
  const classeCard =
    item.status === "pendente" ? `${styles.card} ${styles.cardPendente}` : styles.card;

  return (
    <div className={styles.cardLinha}>
      <Link
        href={hrefCardHistoricoRole(item)}
        className={classeCard}
        aria-label={ariaCardHistorico(item)}
      >
        <BlocoDataHistorico status={item.status} dataHoraSaida={item.dataHoraSaida} />
        <div className={styles.cardCorpo}>
          <div className={styles.cardTopo}>
            <span className={`${styles.cardTitulo} ${classeTitulo[item.status]}`}>
              {linha1}
            </span>
            <span className={classeStatus[item.status]}>
              {STATUS_DIREITA[item.status]}
            </span>
          </div>
          {linha2 ? <p className={styles.cardSubtitulo}>{linha2}</p> : null}
          <div className={styles.cardMeta}>
            <span className={styles.metaItem}>
              <span className="material-symbols-outlined">distance</span>
              {item.distanciaKm} km
            </span>
            <span aria-hidden="true">•</span>
            {item.status === "pendente" ? (
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined">calendar_today</span>
                {formatarDataMeta(item.dataHoraSaida)}
              </span>
            ) : (
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined">group</span>
                {item.participantesConfirmados} motos
              </span>
            )}
          </div>
        </div>
      </Link>
      {item.status === "lider" ? (
        <BotaoClonarRole roleId={item.roleId} titulo={item.titulo} />
      ) : null}
    </div>
  );
};
