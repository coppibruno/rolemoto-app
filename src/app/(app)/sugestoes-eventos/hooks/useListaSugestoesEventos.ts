"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { SugestaoEvento } from "@/types/sugestao-evento";
import { sugestoesEventosService } from "../services/sugestoes-eventos.service";

export const useListaSugestoesEventos = () => {
  const [itens, setItens] = useState<SugestaoEvento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [resumoBusca, setResumoBusca] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    sugestoesEventosService
      .listar()
      .then((dados) => {
        if (!cancelado) setItens(dados.itens);
      })
      .catch(() => {
        if (!cancelado) {
          setItens([]);
          setErro("Não foi possível carregar as sugestões");
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [ticket]);

  const remover = (id: string) => {
    setItens((atual) => atual.filter((item) => item.id !== id));
  };

  const buscar = async () => {
    if (buscando) return;
    setBuscando(true);
    setErroBusca(null);
    setResumoBusca(null);
    try {
      const resultado = await sugestoesEventosService.buscar();
      setResumoBusca(
        resultado.gravadas > 0
          ? `${resultado.gravadas} novos eventos`
          : "Nenhum evento novo nesta rodada",
      );
      recarregar();
    } catch (error) {
      const mensagem =
        error instanceof ApiError ? error.message : "Não foi possível buscar agora";
      setErroBusca(mensagem);
    } finally {
      setBuscando(false);
    }
  };

  return {
    itens,
    carregando,
    erro,
    buscando,
    erroBusca,
    resumoBusca,
    recarregar,
    remover,
    buscar,
  };
};
