import {
  formatarConclusaoTelemetria,
} from "@/lib/telemetria/formatar-telemetria";
import type { PontoTelemetria } from "@/types/role-telemetria";
import { GridMetricasTelemetria } from "./GridMetricasTelemetria";
import { MapaPontosAB } from "./MapaPontosAB";
import styles from "./telemetria.module.css";

type Props = {
  titulo: string;
  encerradoEm: string;
  distanciaKm: number;
  tempoSegundos: number;
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  pontoInicio: PontoTelemetria;
  pontoFim: PontoTelemetria;
  tituloEditavel?: {
    valor: string;
    onMudar: (valor: string) => void;
  };
};

export const DashboardTelemetria = ({
  titulo,
  encerradoEm,
  distanciaKm,
  tempoSegundos,
  velocidadeMaxKmh,
  velocidadeMediaKmh,
  pontoInicio,
  pontoFim,
  tituloEditavel,
}: Props) => {
  return (
    <section className={styles.card}>
      <div className={styles.resumoTopo}>
        <div>
          <div className={styles.badges}>
            <span className={styles.badgeGravada}>Telemetria gravada</span>
          </div>
          {tituloEditavel ? (
            <input
              className={styles.campoTitulo}
              value={tituloEditavel.valor}
              maxLength={80}
              aria-label="Título do passeio"
              onChange={(e) => tituloEditavel.onMudar(e.target.value)}
            />
          ) : (
            <h2 className={styles.tituloResumo}>{titulo}</h2>
          )}
          <p className={styles.subtituloResumo}>
            {formatarConclusaoTelemetria(encerradoEm)}
          </p>
        </div>
        <div className={styles.iconeResumo} aria-hidden>
          <span className="material-symbols-outlined">sports_motorsports</span>
        </div>
      </div>
      <MapaPontosAB
        pontoInicio={pontoInicio}
        pontoFim={pontoFim}
        distanciaKm={distanciaKm}
      />
      <GridMetricasTelemetria
        distanciaKm={distanciaKm}
        tempoSegundos={tempoSegundos}
        velocidadeMaxKmh={velocidadeMaxKmh}
        velocidadeMediaKmh={velocidadeMediaKmh}
      />
    </section>
  );
};
