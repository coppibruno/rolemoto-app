"use client";

import type { SugestaoEvento } from "@/types/sugestao-evento";
import { CartaoSugestaoEvento } from "./CartaoSugestaoEvento";
import styles from "../sugestoes-eventos.module.css";

type Props = {
  itens: SugestaoEvento[];
  onDecidida: (id: string) => void;
};

export const ListaSugestoesEventos = ({ itens, onDecidida }: Props) => {
  return (
    <ul className={styles.lista}>
      {itens.map((item) => (
        <li key={item.id}>
          <CartaoSugestaoEvento sugestao={item} onDecidida={onDecidida} />
        </li>
      ))}
    </ul>
  );
};
