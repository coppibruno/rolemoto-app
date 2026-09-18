"use client";

import { usePathname } from "next/navigation";
import type { ItemMenuConfig } from "../itens-menu";

export const useItemMenuAtivo = () => {
  const pathname = usePathname();

  const estaAtivo = (href: ItemMenuConfig["href"]) => {
    if (href === "/") {
      return (
        pathname === "/" ||
        Boolean(pathname?.startsWith("/roles")) ||
        Boolean(pathname?.startsWith("/eventos")) ||
        Boolean(pathname?.startsWith("/locais"))
      );
    }
    if (href === "/criar-role") {
      return (
        pathname === "/criar-role" ||
        Boolean(pathname?.startsWith("/criar-role/")) ||
        pathname === "/criar-evento" ||
        Boolean(pathname?.startsWith("/criar-evento/")) ||
        pathname === "/criar-local" ||
        Boolean(pathname?.startsWith("/criar-local/"))
      );
    }
    return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
  };

  return { estaAtivo };
};
