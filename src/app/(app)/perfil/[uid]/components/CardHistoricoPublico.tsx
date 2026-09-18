import Link from "next/link";
import type { ItemHistoricoPista } from "@/types/historico-pistas";
import { formatarDataMeta } from "../../formatar-data-historico";
import {
  hrefCardHistoricoPublico,
  PAPEL_CARD,
  STATUS_CARD_PUBLICO,
} from "../constants";
import styles from "../perfil-publico.module.css";

type Props = {
  item: ItemHistoricoPista;
};

export const CardHistoricoPublico = ({ item }: Props) => {
  const eLider = item.status === "lider";
  const statusLabel = STATUS_CARD_PUBLICO[item.status];
  const papel = eLider ? PAPEL_CARD.lider : PAPEL_CARD.participante;

  return (
    <Link
      href={hrefCardHistoricoPublico(item)}
      className={styles.cardHistorico}
      aria-label={`Abrir ${item.titulo}`}
    >
      <div className={styles.cardHistoricoTopo}>
        <div>
          <div className={styles.cardHistoricoTitulo}>{item.titulo}</div>
          <div className={styles.cardHistoricoData}>
            {formatarDataMeta(item.dataHoraSaida)}
          </div>
        </div>
        {statusLabel ? (
          <span
            className={`${styles.badgeStatus} ${eLider ? styles.badgeStatusLider : ""}`}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>
      <div className={styles.cardHistoricoMeta}>
        <span className={styles.metaItem}>
          <span className="material-symbols-outlined" aria-hidden>
            straighten
          </span>
          {item.distanciaKm} km
        </span>
        {eLider ? (
          <span className={styles.metaItem}>
            <span className="material-symbols-outlined" aria-hidden>
              two_wheeler
            </span>
            {item.participantesConfirmados} Motos
          </span>
        ) : null}
        <span
          className={`${styles.metaPapel} ${eLider ? styles.metaPapelLider : ""}`}
        >
          <span className="material-symbols-outlined" aria-hidden>
            {eLider ? "star" : "group"}
          </span>
          {papel}
        </span>
      </div>
    </Link>
  );
};
