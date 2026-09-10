"use client";

import type { Localizacao } from "@/types/role";
import { formatarHora } from "../formatar-horario";
import styles from "../feed.module.css";

type Props = {
  localSaida: Localizacao;
  destinoFinal: Localizacao;
  dataHoraSaida: string;
};

export const RotaRole = ({ localSaida, destinoFinal, dataHoraSaida }: Props) => {
  const hora = formatarHora(dataHoraSaida);

  return (
    <div className={styles.rota}>
      <div className={styles.rotaLinha}>
        <span className={`material-symbols-outlined ${styles.iconePartida}`}>
          trip_origin
        </span>
        <div className={styles.rotaTextos}>
          <span className={styles.rotaLabel}>Partida</span>
          <span className={styles.rotaValor}>
            {localSaida.endereco} ({hora})
          </span>
        </div>
      </div>
      <div className={styles.rotaTraco} aria-hidden />
      <div className={styles.rotaLinha}>
        <span className={`material-symbols-outlined ${styles.iconeDestino}`}>flag</span>
        <div className={styles.rotaTextos}>
          <span className={styles.rotaLabel}>Destino</span>
          <span className={styles.rotaValor}>{destinoFinal.endereco}</span>
        </div>
      </div>
    </div>
  );
};
