import type { RoleTelemetria } from "@/types/role-telemetria";
import type { AlvoArquivoGaragem } from "../hooks/useArquivoGaragem";
import { CardMeuGravado } from "./CardMeuGravado";
import styles from "../meus-roles.module.css";

type Props = {
  itens: RoleTelemetria[];
  ocupadoId: string | null;
  onApagar: (alvo: AlvoArquivoGaragem) => void;
};

export const ListaMeusGravados = ({ itens, ocupadoId, onApagar }: Props) => {
  return (
    <div id="painel-meus-gravados" role="tabpanel" className={styles.lista}>
      {itens.map((item) => (
        <CardMeuGravado
          key={item.id}
          item={item}
          ocupado={ocupadoId === `telemetria-${item.id}`}
          onApagar={onApagar}
        />
      ))}
    </div>
  );
};
