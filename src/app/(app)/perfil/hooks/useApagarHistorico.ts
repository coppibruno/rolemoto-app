"use client";

import { useCallback, useState } from "react";
import { historicoService } from "../services/historico.service";
import { telemetriaService } from "../../telemetria/services/telemetria.service";
import {
  confirmaApagarTelemetria,
  confirmaOcultarHistorico,
  ERRO_APAGAR_HISTORICO,
} from "../constants";

export type AlvoApagarHistorico =
  | { tipo: "role" | "evento"; id: string; titulo: string }
  | { tipo: "telemetria"; id: string; titulo: string };

const TOAST_MS = 2500;

export const useApagarHistorico = (onRemovido: (alvo: AlvoApagarHistorico) => void) => {
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const apagar = useCallback(
    async (alvo: AlvoApagarHistorico) => {
      const chave = `${alvo.tipo}-${alvo.id}`;
      if (ocupadoId) return;

      const mensagem =
        alvo.tipo === "telemetria"
          ? confirmaApagarTelemetria(alvo.titulo)
          : confirmaOcultarHistorico(alvo.titulo);
      if (!window.confirm(mensagem)) return;

      setOcupadoId(chave);
      try {
        if (alvo.tipo === "telemetria") {
          await telemetriaService.excluir(alvo.id);
        } else {
          await historicoService.ocultar(alvo.tipo, alvo.id);
        }
        onRemovido(alvo);
      } catch {
        setFeedback(ERRO_APAGAR_HISTORICO);
        window.setTimeout(() => setFeedback(null), TOAST_MS);
      } finally {
        setOcupadoId(null);
      }
    },
    [ocupadoId, onRemovido],
  );

  return { apagar, ocupadoId, feedback };
};
