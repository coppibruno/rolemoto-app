"use client";

import { useCallback, useState } from "react";
import type { MeuRoleItem } from "@/types/meus-roles";
import { rolesService } from "@/app/(app)/criar-role/services/roles.service";
import {
  confirmCancelarRole,
  ERRO_CANCELAR_ROLE,
  toastRoleCancelado,
  TOAST_MEUS_ROLES_MS,
} from "../constants";

type Props = {
  recarregar: () => void;
};

export const useCancelarRole = ({ recarregar }: Props) => {
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const [toastMensagem, setToastMensagem] = useState(toastRoleCancelado(0));

  const executar = async (item: MeuRoleItem) => {
    const confirmados = item.participantes.confirmados;
    if (!window.confirm(confirmCancelarRole(item.titulo, confirmados))) return;

    setProcessandoId(item.roleId);
    setErro(null);
    try {
      await rolesService.excluir(item.roleId);
      setToastMensagem(toastRoleCancelado(confirmados));
      setToast(true);
      recarregar();
    } catch {
      setErro(ERRO_CANCELAR_ROLE);
    } finally {
      setProcessandoId(null);
    }
  };

  const fecharToast = useCallback(() => setToast(false), []);

  return {
    processandoId,
    erro,
    toast,
    toastMensagem,
    toastMs: TOAST_MEUS_ROLES_MS,
    fecharToast,
    executar,
  };
};
