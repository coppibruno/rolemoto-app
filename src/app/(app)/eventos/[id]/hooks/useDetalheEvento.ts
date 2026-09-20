"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { EventoDetalhe } from "@/types/evento";
import { ERRO_CARREGAR } from "../constants";
import { eventoDetalheService } from "../services/evento-detalhe.service";

export const useDetalheEvento = (id: string) => {
  const [evento, setEvento] = useState<EventoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    eventoDetalheService
      .buscar(id)
      .then((dados) => {
        if (!cancelado) setEvento(dados);
      })
      .catch((e) => {
        if (cancelado) return;
        setEvento(null);
        setErro(e instanceof ApiError ? e.message : ERRO_CARREGAR);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  return { evento, carregando, erro };
};
