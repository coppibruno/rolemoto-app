"use client";

import type { RoleDetalhe, RitmoRole } from "@/types/role";
import { formatarHorarioSaida } from "@/app/(app)/feed/formatar-horario";
import { LABELS_RITMO_BADGE } from "../constants";
import styles from "../confirmacao-role.module.css";

type Props = {
  detalhe: RoleDetalhe;
};

const classeBadge = (ritmo: RitmoRole) => {
  if (ritmo === "tranquila") return styles.badgeTranquila;
  if (ritmo === "moderada") return styles.badgeModerada;
  return styles.badgeAgressiva;
};

export const MiniCardRole = ({ detalhe }: Props) => {
  const confirmados = detalhe.participantes.confirmados;

  return (
    <div className={styles.miniCard}>
      <div className={styles.miniTopo}>
        <div className={styles.miniTituloWrap}>
          <span className="material-symbols-outlined">alt_route</span>
          <span className={styles.miniTitulo}>{detalhe.titulo}</span>
        </div>
        <span className={`${styles.miniBadge} ${classeBadge(detalhe.ritmo)}`}>
          {LABELS_RITMO_BADGE[detalhe.ritmo]}
        </span>
      </div>

      <div className={styles.miniDivisor} />

      <div className={styles.miniGrid}>
        <div className={styles.miniLinha}>
          <span className="material-symbols-outlined">schedule</span>
          <span className={styles.miniTexto}>
            {formatarHorarioSaida(detalhe.dataHoraSaida)}
          </span>
        </div>
        <div className={`${styles.miniLinha} ${styles.miniLinhaFim}`}>
          <span className="material-symbols-outlined">group</span>
          <span className={styles.miniTexto}>{confirmados} confirmados</span>
        </div>
        <div className={`${styles.miniLinha} ${styles.miniPonto}`}>
          <span className={`material-symbols-outlined ${styles.iconePonto}`}>
            pin_drop
          </span>
          <span className={styles.miniPontoTexto}>
            Ponto:{" "}
            <strong className={styles.pontoForte}>
              {detalhe.localSaida.endereco}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
