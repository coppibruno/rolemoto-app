"use client";

import type { RoleDetalhe, RitmoRole } from "@/types/role";
import { formatarHorarioSaida } from "@/app/(app)/feed/formatar-horario";
import { LABELS_RITMO_FUNDO } from "../constants";
import styles from "../confirmacao-role.module.css";

type Props = {
  detalhe: RoleDetalhe;
};

const classeBadge = (ritmo: RitmoRole) => {
  if (ritmo === "tranquila") return styles.badgeTranquila;
  if (ritmo === "moderada") return styles.badgeModerada;
  return styles.badgeAgressiva;
};

export const FundoDetalheRole = ({ detalhe }: Props) => {
  const descricao = detalhe.descricao.trim();

  return (
    <div className={styles.fundo} aria-hidden="true">
      <div className={styles.capa}>
        {detalhe.fotoCapaUrl ? (
          <img src={detalhe.fotoCapaUrl} alt="" className={styles.capaImg} />
        ) : null}
        <div className={styles.capaScrim} />
      </div>

      <div className={styles.fundoMeta}>
        <div className={styles.fundoBadges}>
          <span className={`${styles.badgeRitmo} ${classeBadge(detalhe.ritmo)}`}>
            {LABELS_RITMO_FUNDO[detalhe.ritmo]}
          </span>
          <span className={styles.kmTotais}>{detalhe.distanciaKm} km totais</span>
        </div>
        <h1 className={styles.fundoTitulo}>{detalhe.titulo}</h1>
        {descricao ? <p className={styles.fundoDescricao}>{descricao}</p> : null}
      </div>

      <div className={styles.tileData}>
        <span className="material-symbols-outlined">calendar_month</span>
        <div>
          <div className={styles.tileLabel}>Data</div>
          <div className={styles.tileValor}>
            {formatarHorarioSaida(detalhe.dataHoraSaida)}
          </div>
        </div>
      </div>
    </div>
  );
};
