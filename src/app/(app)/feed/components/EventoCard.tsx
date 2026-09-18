"use client";

import Link from "next/link";
import type { EventoFeedItem } from "@/types/evento";
import { LABELS_ACESSO_EVENTO } from "../constants";
import { formatarHorarioEvento } from "../formatar-horario";
import styles from "../feed.module.css";

type Props = {
  evento: EventoFeedItem;
};

export const EventoCard = ({ evento }: Props) => {
  return (
    <article className={styles.cardEvento}>
      <div className={styles.cardEventoTopo}>
        <div className={styles.cardEventoInfo}>
          <div className={styles.cardEventoBadges}>
            <span className={styles.badgeQuando}>
              {formatarHorarioEvento(evento.dataHoraAbertura)}
            </span>
            <span className={styles.badgeAcesso}>
              {LABELS_ACESSO_EVENTO[evento.acesso]}
            </span>
          </div>
          <h3 className={styles.cardEventoTitulo}>{evento.titulo}</h3>
          <p className={styles.cardEventoEndereco}>
            <span className="material-symbols-outlined" aria-hidden>
              location_on
            </span>
            <span>{evento.local.endereco}</span>
          </p>
        </div>
        <div className={styles.cardEventoThumb}>
          {evento.fotoCapaUrl ? (
            <img
              src={evento.fotoCapaUrl}
              alt=""
              className={styles.cardEventoThumbImg}
            />
          ) : (
            <span className="material-symbols-outlined" aria-hidden>
              local_activity
            </span>
          )}
        </div>
      </div>
      <div className={styles.cardEventoRodape}>
        <Link
          href={`/eventos/${evento.id}`}
          className={styles.botaoVerDetalhes}
        >
          <span>Ver Detalhes</span>
          <span className="material-symbols-outlined" aria-hidden>
            chevron_right
          </span>
        </Link>
      </div>
    </article>
  );
};
