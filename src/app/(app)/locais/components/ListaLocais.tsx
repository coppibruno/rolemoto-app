import type { Local } from "@/types/local";
import { LocalCard } from "./LocalCard";
import styles from "../locais.module.css";

type Props = {
  itens: Local[];
};

export const ListaLocais = ({ itens }: Props) => {
  return (
    <ul className={styles.lista}>
      {itens.map((local) => (
        <li key={local.id}>
          <LocalCard local={local} />
        </li>
      ))}
    </ul>
  );
};
