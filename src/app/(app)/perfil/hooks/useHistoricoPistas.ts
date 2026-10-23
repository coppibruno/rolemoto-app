"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AbaHistorico,
  FiltroTipoHistorico,
  HistoricoPistas,
  ItemHistoricoPista,
} from "@/types/historico-pistas";
import type { ItemHistoricoTelemetria } from "@/types/role-telemetria";
import { ERRO_HISTORICO } from "../constants";
import { historicoService } from "../services/historico.service";
import { telemetriaService } from "../../telemetria/services/telemetria.service";
import type { AlvoApagarHistorico } from "./useApagarHistorico";

const filtrarPorTipo = (
  itens: ItemHistoricoPista[],
  filtro: FiltroTipoHistorico,
): ItemHistoricoPista[] => {
  if (filtro === "todos") return itens;
  if (filtro === "roles") return itens.filter((item) => item.tipo === "role");
  if (filtro === "eventos") return itens.filter((item) => item.tipo === "evento");
  return itens;
};

const paraCard = (doc: {
  id: string;
  titulo: string;
  distanciaKm: number;
  tempoSegundos: number;
  encerradoEm: string;
  publica?: boolean;
}): ItemHistoricoTelemetria => ({
  id: doc.id,
  tipo: "telemetria",
  titulo: doc.titulo,
  distanciaKm: doc.distanciaKm,
  tempoSegundos: doc.tempoSegundos,
  encerradoEm: doc.encerradoEm,
  publica: doc.publica !== false,
});

export const useHistoricoPistas = () => {
  const [dados, setDados] = useState<HistoricoPistas | null>(null);
  const [aba, setAba] = useState<AbaHistorico>("participei");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoHistorico>("todos");
  const [telemetrias, setTelemetrias] = useState<ItemHistoricoTelemetria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoTelemetria, setCarregandoTelemetria] = useState(false);
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

  useEffect(() => {
    if (aba !== "participei" || filtroTipo !== "telemetria") return;
    let cancelado = false;
    setCarregandoTelemetria(true);
    telemetriaService
      .listarMinhas()
      .then((lista) => {
        if (cancelado) return;
        setTelemetrias(lista.map(paraCard));
      })
      .catch(() => {
        if (cancelado) return;
        setTelemetrias([]);
        setErro(ERRO_HISTORICO);
      })
      .finally(() => {
        if (!cancelado) setCarregandoTelemetria(false);
      });
    return () => {
      cancelado = true;
    };
  }, [aba, filtroTipo, ticket]);

  const bruto = dados ? dados[aba] : [];
  const modoTelemetria = aba === "participei" && filtroTipo === "telemetria";
  const itensVisiveis = modoTelemetria
    ? []
    : aba === "participei"
      ? filtrarPorTipo(bruto, filtroTipo)
      : bruto;

  const removerLocal = useCallback((alvo: AlvoApagarHistorico) => {
    if (alvo.tipo === "telemetria") {
      setTelemetrias((lista) => lista.filter((item) => item.id !== alvo.id));
      return;
    }
    setDados((atual) => {
      if (!atual) return atual;
      const aguardando = atual.aguardando.filter((item) => item.roleId !== alvo.id);
      const criados = atual.criados.filter((item) => item.roleId !== alvo.id);
      const participei = atual.participei.filter((item) =>
        alvo.tipo === "evento"
          ? item.tipo !== "evento" || item.eventoId !== alvo.id
          : item.tipo !== "role" || item.roleId !== alvo.id,
      );
      return {
        ...atual,
        aguardando,
        participei,
        criados,
        contagens: {
          aguardando: aguardando.length,
          participei: participei.length,
          criados: criados.length,
        },
      };
    });
  }, []);

  return {
    aba,
    setAba: mudarAba,
    filtroTipo,
    setFiltroTipo,
    dados,
    itensVisiveis,
    telemetrias,
    modoTelemetria,
    carregando: carregando || (modoTelemetria && carregandoTelemetria),
    erro,
    recarregar,
    removerLocal,
  };
};
