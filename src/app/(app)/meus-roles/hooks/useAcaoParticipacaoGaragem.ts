"use client";

import { useState } from "react";
import type { MeuRoleItem } from "@/types/meus-roles";
import { participacaoService } from "@/app/(app)/roles/[id]/participar/services/participacao.service";
import { confirmCancelar, confirmDesistir, ERRO_ACAO } from "../constants";

type Props = {
  recarregar: () => void;
};

export const useAcaoParticipacaoGaragem = ({ recarregar }: Props) => {
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const executar = async (item: MeuRoleItem, tipo: "desistir" | "cancelar") => {
    const mensagem =
      tipo === "desistir" ? confirmDesistir(item.titulo) : confirmCancelar(item.titulo);
    if (!window.confirm(mensagem)) return;

    setProcessandoId(item.roleId);
    setErroAcao(null);
    try {
      await participacaoService.cancelar(item.roleId);
      recarregar();
    } catch {
      setErroAcao(ERRO_ACAO);
    } finally {
      setProcessandoId(null);
    }
  };

  return { processandoId, erroAcao, executar };
};
