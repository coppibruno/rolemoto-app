import type { StatusItemHistorico } from "@/types/historico-pistas";
import { formatarDiaMes } from "../formatar-data-historico";
import styles from "../historico-pistas.module.css";

type Props = {
  status: StatusItemHistorico;
  dataHoraSaida: string;
};

export const BlocoDataHistorico = ({ status, dataHoraSaida }: Props) => {
  if (status === "pendente") {
    return (
      <div className={styles.blocoPendente}>
        <span className="material-symbols-outlined">pending</span>
        <span className={styles.blocoRotulo}>Pendente</span>
      </div>
    );
  }

  const { dia, mes } = formatarDiaMes(dataHoraSaida);
  const classe = status === "lider" ? styles.blocoLider : styles.blocoData;

  return (
    <div className={classe}>
      <span className={styles.blocoDia}>{dia}</span>
      <span className={styles.blocoMes}>{mes}</span>
    </div>
  );
};
