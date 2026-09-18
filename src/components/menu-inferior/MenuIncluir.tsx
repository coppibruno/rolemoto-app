"use client";

import type { RefObject } from "react";
import { ItemMenuIncluir } from "./ItemMenuIncluir";
import { ITENS_MENU_INCLUIR } from "./itens-menu-incluir";
import styles from "./menu-inferior.module.css";

type Props = {
  id: string;
  aberto: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  onFechar: () => void;
};

export const MenuIncluir = ({ id, aberto, menuRef, onFechar }: Props) => {
  if (!aberto) return null;

  return (
    <div
      id={id}
      ref={menuRef}
      className={styles.menuIncluir}
      role="menu"
      aria-label="Incluir"
    >
      {ITENS_MENU_INCLUIR.map((item) => (
        <ItemMenuIncluir
          key={item.id}
          href={item.href ?? undefined}
          icone={item.icone}
          titulo={item.titulo}
          subtitulo={item.subtitulo}
          desabilitado={item.emBreve}
          selo={item.emBreve ? "Em breve" : undefined}
          onNavigate={onFechar}
        />
      ))}
    </div>
  );
};
