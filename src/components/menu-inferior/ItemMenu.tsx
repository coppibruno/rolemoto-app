import Link from "next/link";
import type { ItemMenuConfig } from "./itens-menu";
import styles from "./menu-inferior.module.css";

type Props = {
  item: ItemMenuConfig;
  ativo: boolean;
};

export const ItemMenu = ({ item, ativo }: Props) => {
  return (
    <Link
      href={item.href}
      className={`${styles.item} ${ativo ? styles.itemAtivo : ""}`}
      aria-label={item.ariaLabel}
      aria-current={ativo ? "page" : undefined}
    >
      <span className={`material-symbols-outlined ${styles.icone}`}>
        {item.icone}
      </span>
      <span
        className={`${styles.label} ${item.href === "/meus-roles" ? styles.labelLongo : ""}`}
      >
        {item.label}
      </span>
    </Link>
  );
};
