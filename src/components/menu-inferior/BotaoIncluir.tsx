"use client";

import type { ItemMenuConfig } from "./itens-menu";
import { MenuIncluir } from "./MenuIncluir";
import { useMenuIncluir } from "./hooks/useMenuIncluir";
import styles from "./menu-inferior.module.css";

type Props = {
  item: ItemMenuConfig;
  destacado: boolean;
  admin?: boolean;
};

export const BotaoIncluir = ({ item, destacado, admin }: Props) => {
  const menu = useMenuIncluir();
  const classeFab = `${styles.fab} ${destacado ? styles.fabDestacado : ""}`;

  return (
    <>
      {menu.aberto ? (
        <button
          type="button"
          className={styles.menuBackdrop}
          aria-label="Fechar menu"
          onClick={menu.fechar}
        />
      ) : null}
      <div className={styles.fabSlot}>
        <MenuIncluir
          id={menu.menuId}
          aberto={menu.aberto}
          menuRef={menu.menuRef}
          admin={admin === true}
          onFechar={menu.fechar}
        />
        <button
          type="button"
          ref={menu.botaoRef}
          className={`${classeFab} ${styles.fabBotao}`}
          aria-label="Incluir"
          aria-haspopup="menu"
          aria-expanded={menu.aberto}
          aria-controls={menu.menuId}
          onClick={menu.alternar}
        >
          <span className={`material-symbols-outlined ${styles.fabIcone}`}>
            {item.icone}
          </span>
        </button>
      </div>
    </>
  );
};
