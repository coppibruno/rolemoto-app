"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export const useMenuIncluir = () => {
  const [aberto, setAberto] = useState(false);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const fechar = useCallback(() => setAberto(false), []);
  const alternar = useCallback(() => setAberto((valor) => !valor), []);

  useEffect(() => {
    if (!aberto) return;

    const itens = menuRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])'
    );
    itens?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setAberto(false);
        botaoRef.current?.focus();
        return;
      }

      if (e.key !== "Tab" || !itens?.length) return;
      const lista = Array.from(itens);
      const atual = lista.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (atual <= 0) {
          e.preventDefault();
          lista[lista.length - 1]?.focus();
        }
      } else if (atual === lista.length - 1) {
        e.preventDefault();
        lista[0]?.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto]);

  return { aberto, botaoRef, menuRef, menuId, alternar, fechar };
};
