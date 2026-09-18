import type { MeuEventoGaragemItem } from "@/types/meus-roles";
import { CardMeuEvento } from "./CardMeuEvento";
import styles from "../meus-roles.module.css";

type Props = {
  itens: MeuEventoGaragemItem[];
};

export const ListaMeusEventos = ({ itens }: Props) => {
  return (
    <div className={styles.lista} role="list">
      {itens.map((item) => (
        <div key={item.eventoId} role="listitem">
          <CardMeuEvento item={item} />
        </div>
      ))}
    </div>
  );
};
