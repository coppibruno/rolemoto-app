"use client";

import type { RitmoRole } from "@/types/role";
import { formatarHorarioSaida } from "../formatar-horario";
import styles from "../feed.module.css";

type Props = {
  titulo: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  distanciaKm: number;
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

export const CapaRole = ({
  titulo,
  fotoCapaUrl,
  ritmo,
  distanciaKm,
  dataHoraSaida,
}: Props) => {
  const animacao =
    ritmo === "agressiva" ? styles.bolinhaPing : styles.bolinhaPulse;

  return (
    <div className={styles.capa}>
      {fotoCapaUrl ? (
        <img src={fotoCapaUrl} alt="" className={styles.capaImg} />
      ) : null}
      <div className={styles.capaScrim} />
      <div className={`${styles.badge} ${styles.badgeEsq}`}>
        <span className={`${styles.bolinhaBadge} ${classeBolinha(ritmo)} ${animacao}`} />
        <span className={`${styles.badgeLabel} ${classeTexto(ritmo)}`}>
          {labelRitmo(ritmo)}
        </span>
      </div>
      <div className={`${styles.badge} ${styles.badgeDir}`}>
        <span className="material-symbols-outlined">route</span>
        <span className={styles.badgeKm}>{distanciaKm} KM</span>
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
