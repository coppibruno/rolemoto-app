import type { MeuLocalGaragemItem } from "@/types/meus-roles";
import { CardMeuLocal } from "./CardMeuLocal";
import styles from "../meus-roles.module.css";

type Props = {
  itens: MeuLocalGaragemItem[];
};

export const ListaMeusLocais = ({ itens }: Props) => {
  return (
    <div className={styles.lista} role="list">
      {itens.map((item) => (
        <div key={item.localId} role="listitem">
          <CardMeuLocal item={item} />
        </div>
      ))}
    </div>
  );
};
