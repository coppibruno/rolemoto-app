"use client";

import type { Pilotagem } from "@/types/user";
import { ICONES_PILOTAGEM, LABELS_PILOTAGEM } from "../constants";
import styles from "../aprovacoes.module.css";

type Props = {
  pilotagem: Pilotagem;
};

const classeBadge = (pilotagem: Pilotagem) => {
  if (pilotagem === "tranquila") return styles.badgeTranquila;
  if (pilotagem === "moderada") return styles.badgeModerada;
  return styles.badgeAgressiva;
};

export const BadgePilotagem = ({ pilotagem }: Props) => {
  return (
    <span className={`${styles.badgePilotagem} ${classeBadge(pilotagem)}`}>
      <span className="material-symbols-outlined" aria-hidden>
        {ICONES_PILOTAGEM[pilotagem]}
      </span>
      {LABELS_PILOTAGEM[pilotagem]}
    </span>
  );
};
