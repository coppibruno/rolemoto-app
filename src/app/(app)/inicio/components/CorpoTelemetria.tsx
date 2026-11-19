"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapaEstatico } from "@/components/maps/MapaEstatico";
import {
  formatarDistancia,
  formatarDuracao,
  formatarVelocidade,
} from "@/lib/telemetria/formatar-telemetria";
import { decodificarPolyline } from "@/lib/telemetria/tracado";
import type { AlvoTelemetria } from "@/types/atividade";
import styles from "../inicio.module.css";

type Props = { alvo: AlvoTelemetria; href: string };

export const CorpoTelemetria = ({ alvo, href }: Props) => {
  const trajeto = useMemo(() => decodificarPolyline(alvo.tracadoResumo || ""), [alvo.tracadoResumo]);
  const inicio = trajeto[0];
  const fim = trajeto.length > 1 ? trajeto[trajeto.length - 1] : inicio;

  return (
    <Link href={href} className={styles.linkCorpo} aria-label={`Ver traçado de ${alvo.titulo}`}>
      <div className={styles.mapa}>
        {inicio && fim ? (
          <MapaEstatico
            className={styles.mapa}
            aria-label={`Traçado de ${alvo.titulo}`}
            trajeto={trajeto}
            marcadores={[
              { ...inicio, cor: "var(--tertiary)", rotulo: "A" },
              { ...fim, cor: "var(--tertiary)", rotulo: "B" },
            ]}
          />
        ) : null}
      </div>
      <div className={styles.metricas}>
        <div className={styles.metrica}>
          <span className={styles.metricaValor}>{formatarDistancia(alvo.distanciaKm)}</span>
          <span className={styles.metricaRotulo}>Distância</span>
        </div>
        <div className={styles.metrica}>
          <span className={styles.metricaValor}>
            {formatarDuracao(alvo.tempoMovimentoSegundos)}
          </span>
          <span className={styles.metricaRotulo}>Em movimento</span>
        </div>
        <div className={styles.metrica}>
          <span className={styles.metricaValor}>
            {formatarVelocidade(alvo.velocidadeMediaKmh)}
          </span>
          <span className={styles.metricaRotulo}>Média</span>
        </div>
      </div>
      {alvo.medalhas.length > 0 ? (
        <div className={styles.medalhas}>
          {alvo.medalhas.map((m) => (
            <span key={`${m.conquistaId}-${m.novidade}`} className={styles.chipMedalha}>
              <span className="material-symbols-outlined" aria-hidden>
                military_tech
              </span>
              {m.nome}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
};
