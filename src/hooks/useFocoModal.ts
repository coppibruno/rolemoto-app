"use client";

import { useEffect, useRef } from "react";

const SELETOR_FOCAVEL =
  "button, input, [href], select, textarea, [tabindex]:not([tabindex='-1'])";

const estaHabilitado = (el: HTMLElement) =>
  !el.hasAttribute("disabled") && !(el as HTMLButtonElement).disabled;

/** Prende o foco no diálogo, fecha com Esc e devolve o foco ao sair. */
export const useFocoModal = (onFechar: () => void) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const sheet = ref.current;
    const inicial =
      sheet?.querySelector<HTMLElement>("[data-foco-inicial]") ??
      sheet?.querySelector<HTMLElement>(SELETOR_FOCAVEL);
    if (inicial && estaHabilitado(inicial)) {
      inicial.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onFechar();
        return;
      }
      if (e.key !== "Tab" || !sheet) return;
      const focaveis = [
        ...sheet.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL),
      ].filter(estaHabilitado);
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      anterior?.focus();
    };
  }, [onFechar]);

  return ref;
};
