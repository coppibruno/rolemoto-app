import Link from "next/link";
import type { ItemHistoricoTelemetria } from "@/types/role-telemetria";
import { formatarDistancia, formatarDuracao } from "@/lib/telemetria/formatar-telemetria";
import { formatarDataMeta } from "../formatar-data-historico";
import { BlocoDataHistorico } from "./BlocoDataHistorico";
import styles from "../historico-pistas.module.css";

type Props = {
  item: ItemHistoricoTelemetria;
};

export const CardHistoricoTelemetria = ({ item }: Props) => {
  return (
    <div className={styles.cardLinha}>
      <Link
        href={`/telemetria/${item.id}`}
        className={styles.card}
        aria-label={`Abrir telemetria ${item.titulo}`}
      >
        <BlocoDataHistorico status="concluido" dataHoraSaida={item.encerradoEm} />
        <div className={styles.cardCorpo}>
          <div className={styles.cardTopo}>
            <span className={`${styles.cardTitulo} ${styles.tituloConcluido}`}>
              {item.titulo}
            </span>
            <span className={styles.statusConcluido}>GPS</span>
          </div>
          <p className={styles.cardSubtitulo}>
            {formatarDataMeta(item.encerradoEm)}
          </p>
          <div className={styles.cardMeta}>
            <span className={styles.metaItem}>
              <span className="material-symbols-outlined">distance</span>
              {formatarDistancia(item.distanciaKm)}
            </span>
            <span aria-hidden="true">•</span>
            <span className={styles.metaItem}>
              <span className="material-symbols-outlined">schedule</span>
              {formatarDuracao(item.tempoSegundos)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};
