import type { AbaHistorico, ItemHistoricoPista } from "@/types/historico-pistas";
import type { AlvoApagarHistorico } from "../hooks/useApagarHistorico";
import { CardHistorico } from "./CardHistorico";
import { CardHistoricoEvento } from "./CardHistoricoEvento";
import { EstadoVazioHistorico } from "./EstadoVazioHistorico";
import styles from "../historico-pistas.module.css";

type Props = {
  itens: ItemHistoricoPista[];
  aba: AbaHistorico;
  ariaLabel: string;
  ocupadoId: string | null;
  onApagar: (alvo: AlvoApagarHistorico) => void;
};

export const ListaHistorico = ({
  itens,
  aba,
  ariaLabel,
  ocupadoId,
  onApagar,
}: Props) => {
  if (itens.length === 0) {
    return <EstadoVazioHistorico aba={aba} />;
  }

  return (
    <div className={styles.lista} aria-label={ariaLabel}>
      {itens.map((item) =>
        item.tipo === "evento" ? (
          <CardHistoricoEvento
            key={`${aba}-evento-${item.eventoId}`}
            item={item}
            ocupado={ocupadoId === `evento-${item.eventoId}`}
            onApagar={onApagar}
          />
        ) : (
          <CardHistorico
            key={`${aba}-role-${item.roleId}`}
            item={item}
            ocupado={ocupadoId === `role-${item.roleId}`}
            onApagar={onApagar}
          />
        ),
      )}
    </div>
  );
};
