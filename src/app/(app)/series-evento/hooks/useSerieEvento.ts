"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { SerieEventoDetalhe } from "@/types/serie-evento";
import { seriesEventoService } from "../services/series-evento.service";

export const useSerieEvento = (id: string) => {
  const [detalhe, setDetalhe] = useState<SerieEventoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = () => {
    setCarregando(true);
    seriesEventoService
      .buscar(id)
      .then((dados) => {
        setDetalhe(dados);
        setErro(null);
      })
      .catch((falha) => {
        setDetalhe(null);
        setErro(falha instanceof ApiError ? falha.message : "Não foi possível carregar");
      })
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregar();
  }, [id]);

  const executar = async (acao: () => Promise<unknown>) => {
    setOcupado(true);
    setErro(null);
    try {
      await acao();
      carregar();
      return true;
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : "Não foi possível atualizar");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  return {
    detalhe,
    carregando,
    erro,
    ocupado,
    pausar: () => executar(() =>
      detalhe?.serie.status === "pausada"
        ? seriesEventoService.retomar(id)
        : seriesEventoService.pausar(id),
    ),
    encerrar: () => executar(() => seriesEventoService.encerrar(id)),
    pular: (ymd: string) => executar(() => seriesEventoService.pular(id, ymd)),
  };
};
