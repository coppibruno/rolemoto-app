import {
  formatarDistancia,
  formatarDuracao,
  formatarVelocidade,
} from "@/lib/telemetria/formatar-telemetria";
import { COPY_TELEMETRIA } from "../constants";
import styles from "../telemetria-role.module.css";

type Metricas = {
  velocidadeMaxKmh: number;
  velocidadeMediaKmh: number;
  distanciaKm: number;
  tempoSegundos: number;
};

type Props = {
  metricas: Metricas;
};

export const ResumoTelemetriaRole = ({ metricas }: Props) => {
  const celulas = [
    { rotulo: "Máxima", valor: formatarVelocidade(metricas.velocidadeMaxKmh) },
    { rotulo: "Média", valor: formatarVelocidade(metricas.velocidadeMediaKmh) },
    { rotulo: "Tempo", valor: formatarDuracao(metricas.tempoSegundos) },
    { rotulo: "Distância", valor: formatarDistancia(metricas.distanciaKm) },
  ];

  return (
    <div className={styles.resumo} role="group" aria-label="Resumo da telemetria">
      {celulas.map((celula) => (
        <div key={celula.rotulo} className={styles.celula}>
          <span className={styles.numero}>{celula.valor}</span>
          <span className={styles.rotulo}>{celula.rotulo}</span>
        </div>
      ))}
      <p className={styles.nota}>{COPY_TELEMETRIA.estimativa}</p>
    </div>
  );
};
