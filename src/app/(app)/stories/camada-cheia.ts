"use client";

import { useLayoutEffect } from "react";

let abertas = 0;
let pararFolga: (() => void) | null = null;

const folgaDoViewport = (): number => {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
};

const aplicarFolga = () => {
  document.documentElement.style.setProperty("--folga-viewport", `${folgaDoViewport()}px`);
};

const sincronizar = () => {
  if (abertas > 0) {
    document.body.dataset.camadaCheia = "1";
    if (!pararFolga) {
      aplicarFolga();
      const vv = window.visualViewport;
      vv?.addEventListener("resize", aplicarFolga);
      vv?.addEventListener("scroll", aplicarFolga);
      window.addEventListener("resize", aplicarFolga);
      pararFolga = () => {
        vv?.removeEventListener("resize", aplicarFolga);
        vv?.removeEventListener("scroll", aplicarFolga);
        window.removeEventListener("resize", aplicarFolga);
        pararFolga = null;
      };
    }
    return;
  }
  delete document.body.dataset.camadaCheia;
  pararFolga?.();
  document.documentElement.style.setProperty("--folga-viewport", "0px");
};

/** Tela cheia (story, câmera, nova foto): o menu inferior sai e o rodapé sobe com o viewport visível. */
export const useCamadaCheia = (ativo: boolean) => {
  useLayoutEffect(() => {
    if (!ativo) return;
    abertas += 1;
    sincronizar();
    return () => {
      abertas = Math.max(0, abertas - 1);
      sincronizar();
    };
  }, [ativo]);
};

/** O clique sintético do iOS sai depois do toque e, se a camada já fechou, acerta a tela de trás. */
export const engolirCliqueAtras = (raiz: Element | null) => {
  const engolir = (evento: Event) => {
    if (raiz?.isConnected && evento.target instanceof Node && raiz.contains(evento.target)) return;
    evento.preventDefault();
    evento.stopPropagation();
  };
  document.addEventListener("click", engolir, true);
  window.setTimeout(() => document.removeEventListener("click", engolir, true), 450);
};
