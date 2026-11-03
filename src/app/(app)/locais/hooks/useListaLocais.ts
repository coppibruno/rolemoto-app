"use client";

import { useCallback, useEffect, useState } from "react";
import { guardarCache, useHidratarCache } from "@/hooks/useCacheRetorno";
import type { Local } from "@/types/local";
import { locaisService } from "../services/locais.service";

const CHAVE = "catalogo:locais";

export const useListaLocais = () => {
  const [itens, setItens] = useState<Local[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useHidratarCache<Local[]>(
    CHAVE,
    (valor) => {
      setItens(valor);
      setCarregando(false);
    },
    () => setItens((atual) => (atual.length === 0 ? atual : [])),
  );

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    locaisService
      .listar()
      .then((dados) => {
        if (cancelado) return;
        setItens(dados);
        guardarCache(CHAVE, dados);
      })
      .catch(() => {
        if (!cancelado) {
          setItens([]);
          setErro("Não foi possível carregar os locais");
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [ticket]);

  return { itens, carregando, erro, recarregar };
};
