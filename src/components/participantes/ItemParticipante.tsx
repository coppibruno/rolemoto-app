"use client";

import Link from "next/link";
import type { ParticipanteResumo } from "@/types/participante";
import styles from "./participantes.module.css";

type Props = {
  participante: ParticipanteResumo;
  onNavegar?: () => void;
};

export const ItemParticipante = ({ participante, onNavegar }: Props) => {
  const apelido = participante.apelido || "piloto";

  return (
    <Link
      href={`/perfil/${participante.uid}`}
      className={styles.item}
      onClick={onNavegar}
    >
      {participante.fotoUrl ? (
        <img
          src={participante.fotoUrl}
          alt=""
          className={styles.itemFoto}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className={styles.itemIniciais} aria-hidden>
          {participante.iniciais}
        </span>
      )}
      <span className={styles.itemTextos}>
        <span className={styles.itemApelido}>@{apelido}</span>
        {participante.moto ? (
          <span className={styles.itemMoto}>{participante.moto}</span>
        ) : null}
      </span>
      <span className="material-symbols-outlined" aria-hidden>
        chevron_right
      </span>
    </Link>
  );
};
