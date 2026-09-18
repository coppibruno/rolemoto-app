"use client";

import { useCallback, useEffect, useState } from "react";
import type { Local } from "@/types/local";
import { locaisService } from "../services/locais.service";

export const useListaLocais = () => {
  const [itens, setItens] = useState<Local[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    locaisService
      .listar()
      .then((dados) => {
        if (!cancelado) setItens(dados);
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
