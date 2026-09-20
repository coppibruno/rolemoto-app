import {
  formatarDistancia,
  formatarDuracao,
  formatarVelocidade,
} from "@/lib/telemetria/formatar-telemetria";
import styles from "./telemetria.module.css";

type Props = {
  distanciaKm: number;
  tempoSegundos: number;
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
};

const itens = (props: Props) => [
  {
    rotulo: "Distância",
    valor: formatarDistancia(props.distanciaKm).replace(" km", ""),
    unidade: "KM",
    icone: "straighten",
  },
  {
    rotulo: "Tempo total",
    valor: formatarDuracao(props.tempoSegundos),
    unidade: "",
    icone: "schedule",
  },
  {
    rotulo: "Vel. máx",
    valor: formatarVelocidade(props.velocidadeMaxKmh).replace(" km/h", ""),
    unidade: "KM/H",
    icone: "speed",
  },
  {
    rotulo: "Vel. média",
    valor: formatarVelocidade(props.velocidadeMediaKmh).replace(" km/h", ""),
    unidade: "KM/H",
    icone: "shutter_speed",
  },
];

export const GridMetricasTelemetria = (props: Props) => {
  return (
    <div className={styles.grid}>
      {itens(props).map((item) => (
        <div key={item.rotulo} className={styles.metrica}>
          <div>
            <span className={styles.metricaRotulo}>{item.rotulo}</span>
            <div className={styles.metricaValor}>
              <span className={styles.metricaNum}>{item.valor}</span>
              {item.unidade ? (
                <span className={styles.metricaUnidade}>{item.unidade}</span>
              ) : null}
            </div>
          </div>
          <span className={styles.metricaIcone} aria-hidden>
            <span className="material-symbols-outlined">{item.icone}</span>
          </span>
        </div>
      ))}
    </div>
  );
};
