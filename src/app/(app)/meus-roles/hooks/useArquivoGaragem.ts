"use client";

import { useCallback, useState } from "react";
import { historicoService } from "@/app/(app)/perfil/services/historico.service";
import { telemetriaService } from "@/app/(app)/telemetria/services/telemetria.service";
import {
  confirmaApagarGravado,
  confirmaRemoverDaLista,
  ERRO_ARQUIVO_GARAGEM,
  TOAST_MEUS_ROLES_MS,
} from "../constants";

export type AlvoArquivoGaragem =
  | { tipo: "role" | "evento"; id: string; titulo: string }
  | { tipo: "telemetria"; id: string; titulo: string };

type Opcoes = {
  onRemovido: (alvo: AlvoArquivoGaragem) => void;
};

export const useArquivoGaragem = ({ onRemovido }: Opcoes) => {
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const executar = useCallback(
    async (alvo: AlvoArquivoGaragem) => {
      const chave = `${alvo.tipo}-${alvo.id}`;
      if (ocupadoId) return;

      const mensagem =
        alvo.tipo === "telemetria"
          ? confirmaApagarGravado(alvo.titulo)
          : confirmaRemoverDaLista(alvo.titulo);
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
        setFeedback(ERRO_ARQUIVO_GARAGEM);
        window.setTimeout(() => setFeedback(null), TOAST_MEUS_ROLES_MS);
      } finally {
        setOcupadoId(null);
      }
    },
    [ocupadoId, onRemovido],
  );

  return { executar, ocupadoId, feedback, limparFeedback: () => setFeedback(null) };
};
