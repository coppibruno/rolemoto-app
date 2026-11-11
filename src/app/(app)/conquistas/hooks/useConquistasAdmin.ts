"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { ConquistaAdmin } from "@/types/conquista";
import { TOAST_SALVO_MS } from "../constants";
import { conquistasService } from "../services/conquistas.service";

export type ModoConquistas =
  | { tipo: "lista" }
  | { tipo: "criar" }
  | { tipo: "editar"; item: ConquistaAdmin };

const ordenar = (itens: ConquistaAdmin[]): ConquistaAdmin[] =>
  [...itens].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));

export const useConquistasAdmin = () => {
  const [itens, setItens] = useState<ConquistaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modo, setModo] = useState<ModoConquistas>({ tipo: "lista" });
  const [salvo, setSalvo] = useState(false);
  const toastRef = useRef<number | undefined>(undefined);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setItens(ordenar(await conquistasService.listarAdmin()));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível carregar as conquistas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
    return () => window.clearTimeout(toastRef.current);
  }, [carregar]);

  const aoSalvar = useCallback((item: ConquistaAdmin) => {
    setItens((atuais) => ordenar([...atuais.filter((c) => c.id !== item.id), item]));
    setModo({ tipo: "lista" });
    setSalvo(true);
    window.clearTimeout(toastRef.current);
    toastRef.current = window.setTimeout(() => setSalvo(false), TOAST_SALVO_MS);
  }, []);

  return {
    itens,
    carregando,
    erro,
    modo,
    salvo,
    recarregar: carregar,
    abrirNova: () => setModo({ tipo: "criar" }),
    abrirEdicao: (item: ConquistaAdmin) => setModo({ tipo: "editar", item }),
    voltarParaLista: () => setModo({ tipo: "lista" }),
    aoSalvar,
  };
};
