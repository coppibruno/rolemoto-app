"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import type { RoleDetalhe, UsuarioRole } from "@/types/role";
import { ERRO_CANCELAR, ERRO_GENERICO, ERRO_ROLE_NAO_ENCONTRADO } from "../constants";
import { participacaoService } from "../services/participacao.service";
import { rolesService } from "@/app/(app)/criar-role/services/roles.service";
import { confirmCancelarRole, ERRO_CANCELAR_ROLE } from "@/app/(app)/meus-roles/constants";
import type { EstadoSheet } from "../types";

const derivarEstado = (pedido: UsuarioRole): EstadoSheet => {
  if (pedido.recusadoEm) return "recusado";
  if (pedido.aceito) return "confirmado";
  return "aguardando";
};

export const useConfirmacaoParticipacao = (roleId: string) => {
  const router = useRouter();
  const { firebaseUser, usuario, loading } = useAuth();
  const uid = firebaseUser?.uid;
  const admin = usuario?.admin === true;

  const [carregando, setCarregando] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [detalhe, setDetalhe] = useState<RoleDetalhe | null>(null);
  const [estado, setEstado] = useState<EstadoSheet | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || loading) return;

    let cancelado = false;
    setCarregando(true);
    setErro(null);
    setErroAcao(null);

    const carregar = async () => {
      try {
        const obtido = await participacaoService.buscarDetalhe(roleId);
        if (cancelado) return;

        if (obtido.criadorId === uid) {
          router.replace(`/roles/${roleId}/gerenciar`);
          return;
        }

        if (obtido.minhaParticipacao) {
          setDetalhe(obtido);
          setEstado(derivarEstado(obtido.minhaParticipacao));
          return;
        }

        if (admin) {
          setDetalhe(obtido);
          setEstado("admin");
          return;
        }

        try {
          const pedido = await participacaoService.solicitar(roleId);
          if (cancelado) return;
          setDetalhe({ ...obtido, minhaParticipacao: pedido });
          setEstado(derivarEstado(pedido));
        } catch (falha) {
          if (cancelado) return;
          if (falha instanceof ApiError && falha.status === 403) {
            router.replace(`/roles/${roleId}/gerenciar`);
            return;
          }
          if (falha instanceof ApiError && falha.status === 409) {
            const atual = await participacaoService.buscarDetalhe(roleId);
            if (cancelado) return;
            setDetalhe(atual);
            setEstado(
              atual.minhaParticipacao
                ? derivarEstado(atual.minhaParticipacao)
                : "recusado"
            );
            return;
          }
          throw falha;
        }
      } catch (falha) {
        console.error(falha);
        if (cancelado) return;
        if (falha instanceof ApiError && falha.status === 401) {
          router.replace("/login");
          return;
        }
        if (falha instanceof ApiError && falha.status === 404) {
          setErro(ERRO_ROLE_NAO_ENCONTRADO);
          return;
        }
        setErro(falha instanceof ApiError ? falha.message : ERRO_GENERICO);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [admin, loading, roleId, uid, router]);

  const voltarAoFeed = useCallback(() => {
    router.push("/");
  }, [router]);

  const cancelarPedido = useCallback(async () => {
    if (!detalhe || cancelando) return;
    const ok = window.confirm(
      `Deseja realmente cancelar a solicitação para o rolê ${detalhe.titulo}?`
    );
    if (!ok) return;

    setCancelando(true);
    setErroAcao(null);
    try {
      await participacaoService.cancelar(roleId);
      router.push("/");
    } catch (erro) {
      console.error(erro);
      setErroAcao(ERRO_CANCELAR);
      setCancelando(false);
    }
  }, [cancelando, detalhe, roleId, router]);

  const pedirVaga = useCallback(async () => {
    if (!detalhe || cancelando || estado !== "admin") return;
    setCancelando(true);
    setErroAcao(null);
    try {
      const pedido = await participacaoService.solicitar(roleId);
      setDetalhe({ ...detalhe, minhaParticipacao: pedido });
      setEstado(derivarEstado(pedido));
    } catch (falha) {
      setErroAcao(falha instanceof ApiError ? falha.message : ERRO_GENERICO);
    } finally {
      setCancelando(false);
    }
  }, [cancelando, detalhe, estado, roleId]);

  const cancelarRole = useCallback(async () => {
    if (!detalhe || cancelando) return;
    const confirmados = detalhe.participantes.confirmados;
    if (!window.confirm(confirmCancelarRole(detalhe.titulo, confirmados))) {
      return;
    }

    setCancelando(true);
    setErroAcao(null);
    try {
      // DELETE /roles/:id — backend notifica só confirmados (aceito === true).
      await rolesService.excluir(roleId);
      router.push(detalhe.criadorId === uid ? "/meus-roles" : "/");
    } catch (falha) {
      console.error(falha);
      setErroAcao(
        falha instanceof ApiError ? falha.message : ERRO_CANCELAR_ROLE,
      );
      setCancelando(false);
    }
  }, [cancelando, detalhe, roleId, router, uid]);

  return {
    carregando,
    cancelando,
    detalhe,
    estado,
    erro,
    erroAcao,
    voltarAoFeed,
    cancelarPedido,
    cancelarRole,
    pedirVaga,
  };
};
