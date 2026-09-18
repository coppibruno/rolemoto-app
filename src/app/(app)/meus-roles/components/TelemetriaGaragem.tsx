import type { TelemetriaMeusRoles } from "@/types/meus-roles";
import { LABELS_TELEMETRIA } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  telemetria: TelemetriaMeusRoles;
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

export const TelemetriaGaragem = ({ telemetria }: Props) => {
  const itens = [
    {
      valor: pad2(telemetria.rolesFeitos),
      rotulo: LABELS_TELEMETRIA.rolesFeitos,
      tom: "laranja" as const,
      aria: `${telemetria.rolesFeitos} rolês feitos`,
    },
    {
      valor: pad2(telemetria.eventosParticipados),
      rotulo: LABELS_TELEMETRIA.eventosParticipados,
      tom: "ciano" as const,
      aria: `${telemetria.eventosParticipados} eventos participados`,
    },
    {
      valor: pad2(telemetria.locaisFavoritos),
      rotulo: LABELS_TELEMETRIA.locaisFavoritos,
      tom: "ambar" as const,
      aria: `${telemetria.locaisFavoritos} locais favoritos`,
    },
  ];

  return (
    <div className={styles.telemetriaStrip} role="group" aria-label="Telemetria da garagem">
      {itens.map((item) => (
        <div
          key={item.rotulo}
          className={styles.telemetriaItem}
          aria-label={item.aria}
        >
          <span className={`${styles.telemetriaNum} ${styles[`telemetriaNum_${item.tom}`]}`}>
            {item.valor}
          </span>
          <span className={styles.telemetriaRotulo}>{item.rotulo}</span>
        </div>
      ))}
    </div>
  );
};
