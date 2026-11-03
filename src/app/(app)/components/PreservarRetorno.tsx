"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import {
  cancelarReposicao,
  concluirNavegacao,
  definirRotaAtual,
  iniciarReposicao,
  instalarCapturaRolagem,
  lerRolagem,
  painelRolagem,
  reposicaoEmAndamento,
  reposicionarRolagem,
  salvarRolagem,
} from "@/lib/retorno-tela";

export const PreservarRetorno = () => {
  const pathname = usePathname();

  useLayoutEffect(() => {
    instalarCapturaRolagem();
    const el = painelRolagem();
    definirRotaAtual(pathname);
    const salvo = lerRolagem(pathname);
    concluirNavegacao();
    iniciarReposicao(salvo ?? 0);
    if (!el) return;

    const aoRolar = () => {
      if (reposicaoEmAndamento()) return;
      salvarRolagem(pathname, el.scrollTop);
    };
    const conteudo = el.firstElementChild;
    const observador =
      conteudo && (salvo ?? 0) > 0
        ? new ResizeObserver(() => {
            reposicionarRolagem();
          })
        : null;
    const prazo = window.setTimeout(() => {
      cancelarReposicao();
      observador?.disconnect();
    }, 1500);
    const aoInteragir = () => {
      cancelarReposicao();
      observador?.disconnect();
      window.clearTimeout(prazo);
    };

    if (conteudo && observador) observador.observe(conteudo);
    el.addEventListener("scroll", aoRolar, { passive: true });
    el.addEventListener("pointerdown", aoInteragir);
    el.addEventListener("wheel", aoInteragir, { passive: true });

    return () => {
      window.clearTimeout(prazo);
      observador?.disconnect();
      el.removeEventListener("scroll", aoRolar);
      el.removeEventListener("pointerdown", aoInteragir);
      el.removeEventListener("wheel", aoInteragir);
    };
  }, [pathname]);

  return null;
};
