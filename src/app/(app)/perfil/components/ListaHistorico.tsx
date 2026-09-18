import type { AbaHistorico, ItemHistoricoPista } from "@/types/historico-pistas";
import { CardHistorico } from "./CardHistorico";
import { CardHistoricoEvento } from "./CardHistoricoEvento";
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
      {itens.map((item) =>
        item.tipo === "evento" ? (
          <CardHistoricoEvento key={`${aba}-evento-${item.eventoId}`} item={item} />
        ) : (
          <CardHistorico key={`${aba}-role-${item.roleId}`} item={item} />
        ),
      )}
    </div>
  );
};
