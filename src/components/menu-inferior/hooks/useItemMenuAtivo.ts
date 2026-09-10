"use client";

import { usePathname } from "next/navigation";
import type { ItemMenuConfig } from "../itens-menu";

export const useItemMenuAtivo = () => {
  const pathname = usePathname();

  const estaAtivo = (href: ItemMenuConfig["href"]) => {
    if (href === "/") {
      return pathname === "/" || Boolean(pathname?.startsWith("/roles"));
    }
    return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
  };

  return { estaAtivo };
};
