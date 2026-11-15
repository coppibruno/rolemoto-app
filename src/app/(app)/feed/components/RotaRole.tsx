"use client";

import type { Localizacao } from "@/types/role";
import { BotaoAbrirMaps } from "@/components/maps/BotaoAbrirMaps";
import { tituloLocal } from "@/lib/localizacao";
import { rotuloParadas } from "@/lib/mapa-viagem/viagem";
import { formatarHora } from "../formatar-horario";
import styles from "../feed.module.css";

type Props = {
  localSaida: Localizacao;
  destinoFinal: Localizacao;
  dataHoraSaida: string;
  totalParadas: number;
};

export const RotaRole = ({
  localSaida,
  destinoFinal,
  dataHoraSaida,
  totalParadas,
}: Props) => {
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
            {tituloLocal(localSaida)} ({hora})
          </span>
        </div>
        <BotaoAbrirMaps
          ponto={localSaida}
          variante="icone"
          label="Ver partida"
          className={styles.cardDetalheAcao}
        />
      </div>
      <div className={styles.rotaTraco} aria-hidden />
      {totalParadas > 0 ? (
        <>
          <p className={styles.rotaParadas}>
            <span className="material-symbols-outlined" aria-hidden>
              more_vert
            </span>
            {rotuloParadas(totalParadas)}
          </p>
          <div className={styles.rotaTraco} aria-hidden />
        </>
      ) : null}
      <div className={styles.rotaLinha}>
        <span className={`material-symbols-outlined ${styles.iconeDestino}`}>
          flag
        </span>
        <div className={styles.rotaTextos}>
          <span className={styles.rotaLabel}>Destino</span>
          <span className={styles.rotaValor}>{tituloLocal(destinoFinal)}</span>
        </div>
        <BotaoAbrirMaps
          ponto={destinoFinal}
          variante="icone"
          label="Ver destino"
          className={styles.cardDetalheAcao}
        />
      </div>
    </div>
  );
};
