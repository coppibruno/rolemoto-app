"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { SerieEventoResumo } from "@/types/serie-evento";
import { seriesEventoService } from "../services/series-evento.service";

export const useListaSeries = () => {
  const [itens, setItens] = useState<SerieEventoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const carregar = () => {
    setCarregando(true);
    seriesEventoService
      .listar()
      .then(setItens)
      .catch((falha) => {
        setErro(falha instanceof ApiError ? falha.message : "Não foi possível carregar");
      })
      .finally(() => {
        setCarregando(false);
        setOcupadoId(null);
      });
  };

  useEffect(() => {
    carregar();
  }, []);

  const alternarPausa = async (item: SerieEventoResumo) => {
    setOcupadoId(item.id);
    setErro(null);
    try {
      if (item.status === "pausada") {
        await seriesEventoService.retomar(item.id);
      } else {
        await seriesEventoService.pausar(item.id);
      }
      carregar();
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : "Não foi possível atualizar");
      setOcupadoId(null);
    }
  };

  const encerrar = async (id: string) => {
    setOcupadoId(id);
    setErro(null);
    try {
      await seriesEventoService.encerrar(id);
      carregar();
      return true;
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : "Não foi possível encerrar");
      setOcupadoId(null);
      return false;
    }
  };

  return { itens, carregando, erro, ocupadoId, alternarPausa, encerrar };
};
