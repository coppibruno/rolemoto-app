"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AbaHistorico,
  FiltroTipoHistorico,
  HistoricoPistas,
  ItemHistoricoPista,
} from "@/types/historico-pistas";
import { ERRO_HISTORICO } from "../constants";
import { historicoService } from "../services/historico.service";

const filtrarPorTipo = (
  itens: ItemHistoricoPista[],
  filtro: FiltroTipoHistorico,
): ItemHistoricoPista[] => {
  if (filtro === "todos") return itens;
  if (filtro === "roles") return itens.filter((item) => item.tipo === "role");
  return itens.filter((item) => item.tipo === "evento");
};

export const useHistoricoPistas = () => {
  const [dados, setDados] = useState<HistoricoPistas | null>(null);
  const [aba, setAba] = useState<AbaHistorico>("participei");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoHistorico>("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  const mudarAba = useCallback((nova: AbaHistorico) => {
    setAba(nova);
    setFiltroTipo("todos");
  }, []);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    historicoService
      .buscar()
      .then((resposta) => {
        if (cancelado) return;
        setDados(resposta);
        setAba(resposta.contagens.aguardando > 0 ? "aguardando" : "participei");
      })
      .catch(() => {
        if (cancelado) return;
        setDados(null);
        setErro(ERRO_HISTORICO);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [ticket]);

  const bruto = dados ? dados[aba] : [];
  const itensVisiveis =
    aba === "participei" ? filtrarPorTipo(bruto, filtroTipo) : bruto;

  return {
    aba,
    setAba: mudarAba,
    filtroTipo,
    setFiltroTipo,
    dados,
    itensVisiveis,
    carregando,
    erro,
    recarregar,
  };
};
