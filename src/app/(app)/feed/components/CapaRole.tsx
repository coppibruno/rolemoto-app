"use client";

import type { RitmoRole } from "@/types/role";
import { formatarHorarioSaida } from "../formatar-horario";
import styles from "../feed.module.css";

type Props = {
  titulo: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  distanciaPartidaKm: number;
  distanciaRotaKm: number;
  dataHoraSaida: string;
};

const classeBolinha = (ritmo: RitmoRole) => {
  if (ritmo === "tranquila") return styles.bolinhaTranquila;
  if (ritmo === "moderada") return styles.bolinhaModerada;
  return styles.bolinhaAgressiva;
};

const classeTexto = (ritmo: RitmoRole) => {
  if (ritmo === "tranquila") return styles.chipTranquila;
  if (ritmo === "moderada") return styles.chipModerada;
  return styles.chipAgressiva;
};

const labelRitmo = (ritmo: RitmoRole) =>
  ritmo.charAt(0).toUpperCase() + ritmo.slice(1);

const BadgeKm = ({
  icone,
  km,
  label,
}: {
  icone: string;
  km: number;
  label: string;
}) => (
  <div className={styles.badge} aria-label={label}>
    <span className="material-symbols-outlined" aria-hidden>
      {icone}
    </span>
    <span className={styles.badgeKm} aria-hidden>
      {km} km
    </span>
  </div>
);

export const CapaRole = ({
  titulo,
  fotoCapaUrl,
  ritmo,
  distanciaPartidaKm,
  distanciaRotaKm,
  dataHoraSaida,
}: Props) => {
  const animacao =
    ritmo === "agressiva" ? styles.bolinhaPing : styles.bolinhaPulse;

  return (
    <div className={styles.capa}>
      {fotoCapaUrl ? (
        <img src={fotoCapaUrl} alt="" className={styles.capaImg} />
      ) : (
        <div className={styles.capaPlaceholder} aria-hidden>
          <span className="material-symbols-outlined">two_wheeler</span>
        </div>
      )}
      <div className={styles.capaScrim} />
      <div className={`${styles.badge} ${styles.badgeEsq}`}>
        <span className={`${styles.bolinhaBadge} ${classeBolinha(ritmo)} ${animacao}`} />
        <span className={`${styles.badgeLabel} ${classeTexto(ritmo)}`}>
          {labelRitmo(ritmo)}
        </span>
      </div>
      <div className={styles.badgeDir}>
        <BadgeKm
          icone="near_me"
          km={distanciaPartidaKm}
          label={`${distanciaPartidaKm} quilômetros até a partida`}
        />
        <BadgeKm
          icone="route"
          km={distanciaRotaKm}
          label={`${distanciaRotaKm} quilômetros de rota`}
        />
      </div>
      <div className={styles.capaTitulos}>
        <span className={styles.capaTitulo}>{titulo}</span>
        <span className={styles.capaHorario}>
          <span className="material-symbols-outlined">schedule</span>
          {formatarHorarioSaida(dataHoraSaida)}
        </span>
      </div>
    </div>
  );
};
