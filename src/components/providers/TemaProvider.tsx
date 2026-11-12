"use client";

import {
  createContext,
  useCallback,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import {
  aplicarTema,
  CHAVE_TEMA,
  preferenciaSalva,
  resolverTema,
  TEMA_PADRAO,
  type Tema,
} from "@/lib/tema";

type TemaContextValue = {
  tema: Tema;
  alternar: () => void;
};

export const TemaContext = createContext<TemaContextValue | null>(null);

export const TemaProvider = ({ children }: { children: ReactNode }) => {
  const [tema, setTema] = useState<Tema>(TEMA_PADRAO);

  useLayoutEffect(() => {
    const aplicarAtual = () => {
      const atual = resolverTema();
      aplicarTema(atual);
      setTema(atual);
    };
    aplicarAtual();

    const midia = window.matchMedia("(prefers-color-scheme: light)");
    const aoMudarSistema = () => {
      if (preferenciaSalva()) return;
      aplicarAtual();
    };
    midia.addEventListener("change", aoMudarSistema);
    return () => midia.removeEventListener("change", aoMudarSistema);
  }, []);

  const alternar = useCallback(() => {
    setTema((atual) => {
      const proximo: Tema = atual === "claro" ? "escuro" : "claro";
      aplicarTema(proximo);
      try {
        localStorage.setItem(CHAVE_TEMA, proximo);
      } catch {
        /* armazenamento indisponível: o tema vale só nesta visita */
      }
      return proximo;
    });
  }, []);

  return (
    <TemaContext.Provider value={{ tema, alternar }}>
      {children}
    </TemaContext.Provider>
  );
};
