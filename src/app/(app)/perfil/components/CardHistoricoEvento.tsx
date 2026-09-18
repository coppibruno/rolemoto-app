import Link from "next/link";
import type { ItemHistoricoEvento } from "@/types/historico-pistas";
import {
  ariaCardHistorico,
  hrefCardHistoricoEvento,
  STATUS_DIREITA,
} from "../constants";
import { formatarDataMeta } from "../formatar-data-historico";
import { BlocoDataHistorico } from "./BlocoDataHistorico";
import styles from "../historico-pistas.module.css";

type Props = {
  item: ItemHistoricoEvento;
};

const classeTitulo: Record<ItemHistoricoEvento["status"], string> = {
  confirmado: styles.tituloConfirmado,
  concluido: styles.tituloConcluido,
};

const classeStatus: Record<ItemHistoricoEvento["status"], string> = {
  confirmado: styles.statusConfirmado,
  concluido: styles.statusConcluido,
};

export const CardHistoricoEvento = ({ item }: Props) => {
  return (
    <div className={styles.cardLinha}>
      <Link
        href={hrefCardHistoricoEvento(item)}
        className={styles.card}
        aria-label={ariaCardHistorico(item)}
      >
        <BlocoDataHistorico
          status={item.status}
          dataHoraSaida={item.dataHoraAbertura}
        />
        <div className={styles.cardCorpo}>
          <div className={styles.cardTopo}>
            <span className={`${styles.cardTitulo} ${classeTitulo[item.status]}`}>
              {item.titulo}
            </span>
            <span className={classeStatus[item.status]}>
              {STATUS_DIREITA[item.status]}
            </span>
          </div>
          <span className={styles.badgeTipoEvento}>
            <span className="material-symbols-outlined" aria-hidden>
              local_activity
            </span>
            Evento
          </span>
          <div className={styles.cardMeta}>
            <span className={styles.metaItem}>
              <span className="material-symbols-outlined">location_on</span>
              {item.localNome}
            </span>
            <span aria-hidden="true">•</span>
            <span className={styles.metaItem}>
              <span className="material-symbols-outlined">group</span>
              {item.inscritosConfirmados} inscritos
            </span>
            <span aria-hidden="true">•</span>
            <span className={styles.metaItem}>
              <span className="material-symbols-outlined">calendar_today</span>
              {formatarDataMeta(item.dataHoraAbertura)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};
