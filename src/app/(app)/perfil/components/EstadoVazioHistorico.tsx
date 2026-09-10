import type { AbaHistorico } from "@/types/historico-pistas";
import { VAZIOS_HISTORICO } from "../constants";
import styles from "../historico-pistas.module.css";

type Props = {
  aba: AbaHistorico;
};

export const EstadoVazioHistorico = ({ aba }: Props) => {
  const copy = VAZIOS_HISTORICO[aba];

  return (
    <div className={styles.vazio} role="status">
      <span className="material-symbols-outlined">{copy.icone}</span>
      <p className={styles.vazioTitulo}>{copy.titulo}</p>
      <p className={styles.vazioTexto}>{copy.corpo}</p>
    </div>
  );
};
