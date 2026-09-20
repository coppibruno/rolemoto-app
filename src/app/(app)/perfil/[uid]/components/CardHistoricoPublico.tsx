import Link from "next/link";
import type { ItemHistoricoEvento, ItemHistoricoRole } from "@/types/historico-pistas";
import type { ItemHistoricoTelemetria } from "@/types/role-telemetria";
import { formatarDistancia, formatarDuracao } from "@/lib/telemetria/formatar-telemetria";
import { formatarDataMeta } from "../../formatar-data-historico";
import {
  hrefCardHistoricoPublicoEvento,
  hrefCardHistoricoPublicoRole,
  PAPEL_CARD,
  STATUS_CARD_PUBLICO,
} from "../constants";
import styles from "../perfil-publico.module.css";

type PropsRole = {
  item: ItemHistoricoRole;
};

export const CardHistoricoPublicoRole = ({ item }: PropsRole) => {
  const eLider = item.status === "lider";
  const statusLabel = STATUS_CARD_PUBLICO[item.status];
  const papel = eLider ? PAPEL_CARD.lider : PAPEL_CARD.participante;

  return (
    <Link
      href={hrefCardHistoricoPublicoRole(item)}
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

type PropsEvento = {
  item: ItemHistoricoEvento;
};

export const CardHistoricoPublicoEvento = ({ item }: PropsEvento) => {
  const statusLabel = STATUS_CARD_PUBLICO[item.status];

  return (
    <Link
      href={hrefCardHistoricoPublicoEvento(item)}
      className={styles.cardHistorico}
      aria-label={`Abrir evento ${item.titulo}`}
    >
      <div className={styles.cardHistoricoTopo}>
        <div>
          <div className={styles.cardHistoricoTitulo}>{item.titulo}</div>
          <div className={styles.cardHistoricoData}>
            {formatarDataMeta(item.dataHoraAbertura)}
          </div>
        </div>
        {statusLabel ? (
          <span className={styles.badgeStatus}>{statusLabel}</span>
        ) : null}
      </div>
      <div className={styles.cardHistoricoMeta}>
        <span className={styles.badgeTipoEvento}>
          <span className="material-symbols-outlined" aria-hidden>
            local_activity
          </span>
          Evento
        </span>
        <span className={styles.metaItem}>
          <span className="material-symbols-outlined" aria-hidden>
            location_on
          </span>
          {item.localNome}
        </span>
        <span className={styles.metaItem}>
          <span className="material-symbols-outlined" aria-hidden>
            group
          </span>
          {item.inscritosConfirmados} inscritos
        </span>
      </div>
    </Link>
  );
};

type PropsTelemetria = {
  item: ItemHistoricoTelemetria;
};

export const CardHistoricoPublicoTelemetria = ({ item }: PropsTelemetria) => {
  return (
    <Link
      href={`/telemetria/${item.id}`}
      className={styles.cardHistorico}
      aria-label={`Abrir telemetria ${item.titulo}`}
    >
      <div className={styles.cardHistoricoTopo}>
        <div>
          <div className={styles.cardHistoricoTitulo}>{item.titulo}</div>
          <div className={styles.cardHistoricoData}>
            {formatarDataMeta(item.encerradoEm)}
          </div>
        </div>
        <span className={styles.badgeStatus}>GPS</span>
      </div>
      <div className={styles.cardHistoricoMeta}>
        <span className={styles.metaItem}>
          <span className="material-symbols-outlined" aria-hidden>
            straighten
          </span>
          {formatarDistancia(item.distanciaKm)}
        </span>
        <span className={styles.metaItem}>
          <span className="material-symbols-outlined" aria-hidden>
            schedule
          </span>
          {formatarDuracao(item.tempoSegundos)}
        </span>
      </div>
    </Link>
  );
};
