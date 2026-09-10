import type { AbaHistorico, ItemHistoricoPista } from "@/types/historico-pistas";
import { CardHistorico } from "./CardHistorico";
import { EstadoVazioHistorico } from "./EstadoVazioHistorico";
import styles from "../historico-pistas.module.css";

type Props = {
  itens: ItemHistoricoPista[];
  aba: AbaHistorico;
  ariaLabel: string;
};

export const ListaHistorico = ({ itens, aba, ariaLabel }: Props) => {
  if (itens.length === 0) {
    return <EstadoVazioHistorico aba={aba} />;
  }

  return (
    <div className={styles.lista} aria-label={ariaLabel}>
      {itens.map((item) => (
        <CardHistorico key={`${aba}-${item.roleId}`} item={item} />
      ))}
    </div>
  );
};
