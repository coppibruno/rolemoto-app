"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventoFeedItem } from "@/types/evento";
import { filtrosParaEventos, eventosService } from "../services/eventos.service";
import type { FiltroQuando, PontoFeed, RaioKm } from "../types";

type Params = {
  ponto: PontoFeed | null;
  raioKm: RaioKm;
  quando: FiltroQuando | null;
  busca: string;
  ativo: boolean;
};

export const useListaEventos = ({
  ponto,
  raioKm,
  quando,
  busca,
  ativo,
}: Params) => {
  const [itens, setItens] = useState<EventoFeedItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  const quandoKey =
    quando && typeof quando === "object"
      ? `data:${quando.iso}`
      : String(quando ?? "");

  useEffect(() => {
    if (!ativo) return;

    const params = filtrosParaEventos({ ponto, raioKm, quando, busca });
    if (!params) {
      setItens([]);
      setCarregando(false);
      setErro(null);
      return;
    }

    let cancelado = false;
    setCarregando(true);
    setErro(null);

    eventosService
      .listar(params)
      .then((dados) => {
        if (!cancelado) setItens(dados);
      })
      .catch(() => {
        if (!cancelado) {
          setItens([]);
          setErro("Não foi possível carregar os eventos");
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [ativo, ponto?.lat, ponto?.lng, raioKm, quandoKey, busca, ticket]);

  return { itens, carregando, erro, recarregar };
};
