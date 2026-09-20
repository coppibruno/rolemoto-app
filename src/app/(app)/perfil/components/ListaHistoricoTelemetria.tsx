import type { ItemHistoricoTelemetria } from "@/types/role-telemetria";
import { VAZIO_TELEMETRIA } from "../constants";
import { CardHistoricoTelemetria } from "./CardHistoricoTelemetria";
import styles from "../historico-pistas.module.css";

type Props = {
  itens: ItemHistoricoTelemetria[];
};

export const ListaHistoricoTelemetria = ({ itens }: Props) => {
  if (itens.length === 0) {
    return (
      <div className={styles.vazio} role="status">
        <span className="material-symbols-outlined">{VAZIO_TELEMETRIA.icone}</span>
        <p className={styles.vazioTitulo}>{VAZIO_TELEMETRIA.titulo}</p>
        <p className={styles.vazioTexto}>{VAZIO_TELEMETRIA.corpo}</p>
      </div>
    );
  }

  return (
    <div className={styles.lista} aria-label="Passeios com telemetria">
      {itens.map((item) => (
        <CardHistoricoTelemetria key={item.id} item={item} />
      ))}
    </div>
  );
};
