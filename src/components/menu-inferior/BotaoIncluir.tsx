import Link from "next/link";
import type { ItemMenuConfig } from "./itens-menu";
import styles from "./menu-inferior.module.css";

type Props = {
  item: ItemMenuConfig;
  destacado: boolean;
};

export const BotaoIncluir = ({ item, destacado }: Props) => {
  return (
    <div className={styles.fabSlot}>
      <Link
        href={item.href}
        className={`${styles.fab} ${destacado ? styles.fabDestacado : ""}`}
        aria-label={item.ariaLabel}
        aria-current={destacado ? "page" : undefined}
      >
        <span className={`material-symbols-outlined ${styles.fabIcone}`}>
          {item.icone}
        </span>
      </Link>
    </div>
  );
};
