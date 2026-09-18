"use client";

import { useCallback, useEffect, useState } from "react";
import type { LocalFeedItem } from "@/types/local";
import { filtrosParaLocais, locaisService } from "../services/locais.service";
import type { PontoFeed, RaioKm } from "../types";

type Params = {
  ponto: PontoFeed | null;
  raioKm: RaioKm;
  busca: string;
  ativo: boolean;
};

export const useListaLocais = ({ ponto, raioKm, busca, ativo }: Params) => {
  const [itens, setItens] = useState<LocalFeedItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useEffect(() => {
    if (!ativo) return;

    const params = filtrosParaLocais({ ponto, raioKm, busca });
    if (!params) {
      setItens([]);
      setCarregando(false);
      setErro(null);
      return;
    }

    let cancelado = false;
    setCarregando(true);
    setErro(null);

    locaisService
      .listar(params)
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
  }, [ativo, ponto?.lat, ponto?.lng, raioKm, busca, ticket]);

  return { itens, carregando, erro, recarregar };
};
