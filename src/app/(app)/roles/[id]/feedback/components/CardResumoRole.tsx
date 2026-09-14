"use client";

import type { RoleDetalhe } from "@/types/role";
import { tituloLocal } from "@/lib/localizacao";
import styles from "../feedback-role.module.css";

type Props = {
  detalhe: RoleDetalhe;
};

export const CardResumoRole = ({ detalhe }: Props) => {
  const rota = `${tituloLocal(detalhe.localSaida)} → ${tituloLocal(detalhe.destinoFinal)}`;
  const apelido = detalhe.criador.apelido || "piloto";

  return (
    <article className={styles.cardResumo}>
      <div className={styles.thumb}>
        {detalhe.fotoCapaUrl ? (
          <img
            src={detalhe.fotoCapaUrl}
            alt=""
            className={styles.thumbImg}
          />
        ) : null}
        <div className={styles.thumbScrim} />
        <span className={styles.pillKm}>{detalhe.distanciaKm} KM</span>
      </div>
      <div className={styles.resumoCorpo}>
        <h2 className={styles.resumoTitulo}>{detalhe.titulo}</h2>
        <div className={styles.resumoRota}>
          <span className="material-symbols-outlined" aria-hidden>
            near_me
          </span>
          <span className={styles.resumoRotaTexto}>{rota}</span>
        </div>
        <p className={styles.faixaCriador}>
          Criador da Rota: <strong>@{apelido}</strong>
        </p>
      </div>
    </article>
  );
};
