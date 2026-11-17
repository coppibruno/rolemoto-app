"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { EventoPassadoAdmin } from "@/types/evento-passado-admin";
import { eventosPassadosService } from "../services/eventos-passados.service";

export const useEventosPassados = () => {
  const [itens, setItens] = useState<EventoPassadoAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    eventosPassadosService
      .listar()
      .then((lista) => {
        if (!cancelado) setItens(lista);
      })
      .catch((e) => {
        if (cancelado) return;
        setItens([]);
        setErro(
          e instanceof ApiError ? e.message : "Não deu para carregar os eventos",
        );
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [versao]);

  return {
    itens,
    carregando,
    erro,
    recarregar: () => setVersao((n) => n + 1),
  };
};
