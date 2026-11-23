import type { TelemetriaMeusRoles } from "@/types/meus-roles";
import { LABELS_TELEMETRIA } from "../constants";
import styles from "../meus-roles.module.css";

export type DestinoStripGaragem =
  | "rolesFeitos"
  | "eventos"
  | "locais"
  | "gravados";

type Props = {
  telemetria: TelemetriaMeusRoles;
  onSelecionar?: (destino: DestinoStripGaragem) => void;
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

export const TelemetriaGaragem = ({ telemetria, onSelecionar }: Props) => {
  const itens: {
    destino: DestinoStripGaragem;
    valor: string;
    rotulo: string;
    tom: "laranja" | "ciano" | "ambar" | "verde";
    aria: string;
  }[] = [
    {
      destino: "rolesFeitos",
      valor: pad2(telemetria.rolesFeitos),
      rotulo: LABELS_TELEMETRIA.rolesFeitos,
      tom: "laranja",
      aria: `${telemetria.rolesFeitos} rolês feitos`,
    },
    {
      destino: "eventos",
      valor: pad2(telemetria.eventosParticipados),
      rotulo: LABELS_TELEMETRIA.eventosParticipados,
      tom: "ciano",
      aria: `${telemetria.eventosParticipados} eventos participados`,
    },
    {
      destino: "locais",
      valor: pad2(telemetria.locaisFavoritos),
      rotulo: LABELS_TELEMETRIA.locaisFavoritos,
      tom: "ambar",
      aria: `${telemetria.locaisFavoritos} locais favoritos`,
    },
    {
      destino: "gravados",
      valor: pad2(telemetria.gravados ?? 0),
      rotulo: LABELS_TELEMETRIA.gravados,
      tom: "verde",
      aria: `${telemetria.gravados ?? 0} passeios gravados`,
    },
  ];

  return (
    <div className={styles.telemetriaStrip} role="group" aria-label="Resumo da garagem">
      {itens.map((item) =>
        onSelecionar ? (
          <button
            key={item.rotulo}
            type="button"
            className={styles.telemetriaItemBotao}
            aria-label={`${item.aria}. Abrir lista`}
            onClick={() => onSelecionar(item.destino)}
          >
            <span className={`${styles.telemetriaNum} ${styles[`telemetriaNum_${item.tom}`]}`}>
              {item.valor}
            </span>
            <span className={styles.telemetriaRotulo}>{item.rotulo}</span>
          </button>
        ) : (
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
        ),
      )}
    </div>
  );
};
