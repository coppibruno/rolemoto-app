"use client";

import Link from "next/link";
import type { EventoFeedItem } from "@/types/evento";
import { LABELS_ACESSO_EVENTO } from "../constants";
import { formatarHorarioEvento } from "../formatar-horario";
import { BotaoInscreverEvento } from "./BotaoInscreverEvento";
import { SeloMediaAvaliacoes } from "./SeloMediaAvaliacoes";
import styles from "../feed.module.css";

type Props = {
  evento: EventoFeedItem;
};

const eventoEncerrou = (evento: EventoFeedItem): boolean => {
  const limite = evento.dataHoraEncerramento ?? evento.dataHoraAbertura;
  return Date.parse(limite) <= Date.now();
};

export const EventoCard = ({ evento }: Props) => {
  const href = `/eventos/${evento.id}`;
  const encerrado = eventoEncerrou(evento);
  const mostrarAvaliar =
    evento.inscrito && encerrado && evento.avaliado !== true;
  const mostrarVerAvaliacao = evento.avaliado === true;

  return (
    <article className={styles.cardEvento}>
      <Link
        href={href}
        className={styles.cardDetalheLink}
        aria-label={`Ver detalhes de ${evento.titulo}`}
      />
      <div className={styles.cardEventoTopo}>
        <div className={styles.cardEventoInfo}>
          <div className={styles.cardEventoBadges}>
            <span className={styles.badgeQuando}>
              {formatarHorarioEvento(evento.dataHoraAbertura)}
            </span>
            <span className={styles.badgeAcesso}>
              {LABELS_ACESSO_EVENTO[evento.acesso]}
            </span>
            <SeloMediaAvaliacoes
              notaMedia={evento.notaMedia ?? 0}
              totalAvaliacoes={evento.totalAvaliacoes ?? 0}
            />
          </div>
          <h3 className={styles.cardEventoTitulo}>{evento.titulo}</h3>
          <p className={styles.cardEventoEndereco}>
            <span className="material-symbols-outlined" aria-hidden>
              location_on
            </span>
            <span>{evento.local.endereco}</span>
          </p>
        </div>
        <div className={styles.cardEventoThumb} aria-hidden>
          {evento.fotoCapaUrl ? (
            <img
              src={evento.fotoCapaUrl}
              alt=""
              className={styles.cardEventoThumbImg}
            />
          ) : (
            <span className="material-symbols-outlined">
              local_activity
            </span>
          )}
        </div>
      </div>
      <div className={`${styles.cardEventoRodape} ${styles.cardDetalheAcao}`}>
        <BotaoInscreverEvento
          id={evento.id}
          acesso={evento.acesso}
          linkIngresso={evento.linkIngresso}
          inscrito={evento.inscrito}
        />
        {mostrarAvaliar || mostrarVerAvaliacao ? (
          <div className={styles.cardEventoAcoesExtra}>
            <Link
              href={`/eventos/${evento.id}/avaliar`}
              className={styles.botaoAvaliar}
            >
              <span className="material-symbols-outlined" aria-hidden>
                star
              </span>
              {mostrarVerAvaliacao ? "Ver avaliação" : "Avaliar"}
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
};
