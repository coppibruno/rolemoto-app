import type { MeuEventoGaragemItem } from "@/types/meus-roles";
import type { AlvoArquivoGaragem } from "../hooks/useArquivoGaragem";
import { CardMeuEvento } from "./CardMeuEvento";
import styles from "../meus-roles.module.css";

type Props = {
  itens: MeuEventoGaragemItem[];
  ocupadoArquivoId?: string | null;
  onRemover?: (alvo: AlvoArquivoGaragem) => void;
};

export const ListaMeusEventos = ({
  itens,
  ocupadoArquivoId = null,
  onRemover,
}: Props) => {
  return (
    <div className={styles.lista} role="list">
      {itens.map((item) => (
        <div key={item.eventoId} role="listitem">
          <CardMeuEvento
            item={item}
            ocupadoRemover={ocupadoArquivoId === `evento-${item.eventoId}`}
            onRemover={onRemover}
          />
        </div>
      ))}
    </div>
  );
};
