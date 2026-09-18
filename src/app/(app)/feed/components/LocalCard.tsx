"use client";

import type { LocalFeedItem } from "@/types/local";
import { urlAbrirMaps } from "@/lib/maps";
import {
  FACILIDADES_FEED,
  ICONES_CATEGORIA_LOCAL,
  LABELS_CATEGORIA_LOCAL,
} from "../constants";
import styles from "../feed.module.css";

type Props = {
  local: LocalFeedItem;
};

const textoHorario = (local: LocalFeedItem) => {
  if (local.aberto24h) return "Aberto 24H";
  const hoje = new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const dia = local.horarios.find((item) => item.dia === hoje);
  if (dia && !dia.fechado && dia.abertura && dia.fechamento) {
    return `${dia.abertura}–${dia.fechamento}`;
  }
  const qualquer = local.horarios.find(
    (item) => !item.fechado && item.abertura && item.fechamento
  );
  if (qualquer?.abertura && qualquer.fechamento) {
    return `${qualquer.abertura}–${qualquer.fechamento}`;
  }
  return null;
};

export const LocalCard = ({ local }: Props) => {
  const horario = textoHorario(local);
  const facilidades = local.facilidades
    .map((valor) => FACILIDADES_FEED.find((item) => item.valor === valor))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 3);

  const href =
    local.linkMaps.trim() ||
    urlAbrirMaps({
      lat: local.lat,
      lng: local.lng,
      endereco: local.endereco,
      nome: local.nome,
    });

  return (
    <article className={styles.cardLocal}>
      <div className={styles.cardLocalTopo}>
        <div className={styles.cardLocalInfo}>
          <div className={styles.cardLocalBadges}>
            {horario ? (
              <span className={styles.badge24h}>
                {local.aberto24h ? (
                  <span className="material-symbols-outlined" aria-hidden>
                    bolt
                  </span>
                ) : null}
                {horario}
              </span>
            ) : null}
            <span className={styles.badgeCategoria}>
              {LABELS_CATEGORIA_LOCAL[local.categoria]}
            </span>
          </div>
          <h3 className={styles.cardLocalTitulo}>{local.nome}</h3>
          <p className={styles.cardLocalEndereco}>{local.endereco}</p>
        </div>
        <div className={styles.cardLocalIcone} aria-hidden>
          {local.fotoFachadaUrl ? (
            <img
              src={local.fotoFachadaUrl}
              alt=""
              className={styles.cardLocalThumb}
            />
          ) : (
            <span className="material-symbols-outlined">
              {ICONES_CATEGORIA_LOCAL[local.categoria]}
            </span>
          )}
        </div>
      </div>

      {facilidades.length > 0 ? (
        <div className={styles.cardLocalChips}>
          {facilidades.map((item) => (
            <span key={item.valor} className={styles.chipFacilidade}>
              <span className="material-symbols-outlined" aria-hidden>
                {item.icone}
              </span>
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.botaoRotaDireta}
      >
        <span className="material-symbols-outlined" aria-hidden>
          directions
        </span>
        <span>Traçar Rota Direta</span>
      </a>
    </article>
  );
};
