"use client";

import type { SugestaoLocal } from "@/types/sugestao-local";
import { CartaoSugestaoLocal } from "./CartaoSugestaoLocal";
import styles from "../sugestoes-locais.module.css";

type Props = {
  itens: SugestaoLocal[];
  onDecidida: (id: string) => void;
};

export const ListaSugestoesLocais = ({ itens, onDecidida }: Props) => {
  return (
    <ul className={styles.lista}>
      {itens.map((item) => (
        <li key={item.id}>
          <CartaoSugestaoLocal sugestao={item} onDecidida={onDecidida} />
        </li>
      ))}
    </ul>
  );
};
