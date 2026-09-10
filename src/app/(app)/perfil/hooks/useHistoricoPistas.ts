"use client";

import { useCallback, useEffect, useState } from "react";
import type { AbaHistorico, HistoricoPistas } from "@/types/historico-pistas";
import { ERRO_HISTORICO } from "../constants";
import { historicoService } from "../services/historico.service";

export const useHistoricoPistas = () => {
  const [dados, setDados] = useState<HistoricoPistas | null>(null);
  const [aba, setAba] = useState<AbaHistorico>("participei");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

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

  const itensVisiveis = dados ? dados[aba] : [];

  return { aba, setAba, dados, itensVisiveis, carregando, erro, recarregar };
};
