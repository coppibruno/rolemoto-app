"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type {
  AbaHistoricoPublico,
  HistoricoPublico,
} from "@/types/perfil-publico";
import type {
  FiltroTipoHistorico,
  ItemHistoricoPista,
} from "@/types/historico-pistas";
import type { ItemHistoricoTelemetria } from "@/types/role-telemetria";
import { ERRO_HISTORICO_PUBLICO } from "../constants";
import { perfilPublicoService } from "../services/perfil-publico.service";
import { telemetriaService } from "../../../telemetria/services/telemetria.service";

const filtrarPorTipo = (
  itens: ItemHistoricoPista[],
  filtro: FiltroTipoHistorico,
): ItemHistoricoPista[] => {
  if (filtro === "todos") return itens;
  if (filtro === "roles") return itens.filter((item) => item.tipo === "role");
  if (filtro === "eventos") return itens.filter((item) => item.tipo === "evento");
  return itens;
};

export const useHistoricoPublico = (uid: string) => {
  const [historico, setHistorico] = useState<HistoricoPublico | null>(null);
  const [aba, setAbaState] = useState<AbaHistoricoPublico>("concluidos");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoHistorico>("todos");
  const [telemetrias, setTelemetrias] = useState<ItemHistoricoTelemetria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoTelemetria, setCarregandoTelemetria] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const setAba = (nova: AbaHistoricoPublico) => {
    setAbaState(nova);
    setFiltroTipo("todos");
  };

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      if (!uid) {
        setHistorico(null);
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro(null);
      try {
        const dados = await perfilPublicoService.historico(uid);
        if (cancelado) return;
        setHistorico(dados);
      } catch (e) {
        if (cancelado) return;
        const mensagem =
          e instanceof ApiError ? e.message : ERRO_HISTORICO_PUBLICO;
        setErro(mensagem);
        setHistorico(null);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid || aba !== "concluidos" || filtroTipo !== "telemetria") return;
    let cancelado = false;
    setCarregandoTelemetria(true);
    telemetriaService
      .listarDeUsuario(uid)
      .then((lista) => {
        if (cancelado) return;
        setTelemetrias(lista);
      })
      .catch((e) => {
        if (cancelado) return;
        setTelemetrias([]);
        setErro(e instanceof ApiError ? e.message : ERRO_HISTORICO_PUBLICO);
      })
      .finally(() => {
        if (!cancelado) setCarregandoTelemetria(false);
      });
    return () => {
      cancelado = true;
    };
  }, [uid, aba, filtroTipo]);

  const bruto =
    historico == null
      ? []
      : aba === "concluidos"
        ? historico.concluidos
        : historico.comoLider;

  const modoTelemetria = aba === "concluidos" && filtroTipo === "telemetria";
  const itens = modoTelemetria
    ? []
    : aba === "concluidos"
      ? filtrarPorTipo(bruto, filtroTipo)
      : bruto;

  return {
    historico,
    aba,
    setAba,
    filtroTipo,
    setFiltroTipo,
    itens,
    telemetrias,
    modoTelemetria,
    carregando: carregando || (modoTelemetria && carregandoTelemetria),
    erro,
  };
};
