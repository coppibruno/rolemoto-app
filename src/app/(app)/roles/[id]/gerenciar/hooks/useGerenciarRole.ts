"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import type { DecisaoPiloto, SolicitacaoLider } from "@/types/aprovacao";
import type { RoleDetalhe } from "@/types/role";
import { aprovacoesService } from "@/app/(app)/aprovacoes/services/aprovacoes.service";
import { rolesService } from "@/app/(app)/criar-role/services/roles.service";
import { participacaoService } from "@/app/(app)/roles/[id]/participar/services/participacao.service";
import {
  confirmCancelarRole,
} from "@/app/(app)/meus-roles/constants";
import {
  ERRO_CANCELAR_ROLE,
  ERRO_CARREGAR,
  ERRO_ROLE_NAO_ENCONTRADO,
  ERRO_SEM_ACESSO,
} from "../constants";

const filtrarPorRole = (itens: SolicitacaoLider[], roleId: string) =>
  itens.filter((item) => item.role.id === roleId);

const podeGerenciar = (
  detalhe: RoleDetalhe,
  uid: string,
  admin: boolean,
): boolean => detalhe.criadorId === uid || admin;

export const useGerenciarRole = (roleId: string) => {
  const router = useRouter();
  const { firebaseUser, usuario } = useAuth();
  const uid = firebaseUser?.uid;
  const admin = Boolean(usuario?.admin);

  const [carregando, setCarregando] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [detalhe, setDetalhe] = useState<RoleDetalhe | null>(null);
  const [pendentes, setPendentes] = useState<SolicitacaoLider[]>([]);
  const [confirmados, setConfirmados] = useState<SolicitacaoLider[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useEffect(() => {
    if (!uid) return;

    let cancelado = false;
    setCarregando(true);
    setErro(null);

    const carregar = async () => {
      try {
        const [obtido, filaPendente, filaAceito] = await Promise.all([
          participacaoService.buscarDetalhe(roleId),
          aprovacoesService.listar("pendente"),
          aprovacoesService.listar("aceito"),
        ]);
        if (cancelado) return;

        if (!podeGerenciar(obtido, uid, admin)) {
          setErro(ERRO_SEM_ACESSO);
          router.replace(`/roles/${roleId}/participar`);
          return;
        }

        setDetalhe(obtido);
        setPendentes(filtrarPorRole(filaPendente.itens, roleId));
        setConfirmados(filtrarPorRole(filaAceito.itens, roleId));
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
        setErro(falha instanceof ApiError ? falha.message : ERRO_CARREGAR);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [roleId, uid, admin, router, ticket]);

  const aplicarDecisao = useCallback(
    (item: SolicitacaoLider, decisao: DecisaoPiloto) => {
      setPendentes((atual) => atual.filter((i) => i.id !== item.id));
      if (decisao === "aceitar") {
        const aceito: SolicitacaoLider = {
          ...item,
          participacao: {
            ...item.participacao,
            aceito: true,
            aceitoEm: new Date().toISOString(),
          },
          role: {
            ...item.role,
            confirmados: item.role.confirmados + 1,
          },
        };
        setConfirmados((atual) => [aceito, ...atual]);
        setDetalhe((atual) =>
          atual
            ? {
                ...atual,
                participantes: {
                  confirmados: atual.participantes.confirmados + 1,
                },
              }
            : atual,
        );
      }
    },
    [],
  );

  const cancelarRole = useCallback(async () => {
    if (!detalhe || cancelando) return;
    const n = detalhe.participantes.confirmados;
    if (!window.confirm(confirmCancelarRole(detalhe.titulo, n))) return;

    setCancelando(true);
    setErroAcao(null);
    try {
      await rolesService.excluir(roleId);
      router.push("/meus-roles");
    } catch (falha) {
      console.error(falha);
      setErroAcao(
        falha instanceof ApiError ? falha.message : ERRO_CANCELAR_ROLE,
      );
      setCancelando(false);
    }
  }, [cancelando, detalhe, roleId, router]);

  const voltar = useCallback(() => {
    router.push("/meus-roles");
  }, [router]);

  return {
    carregando,
    cancelando,
    detalhe,
    pendentes,
    confirmados,
    erro,
    erroAcao,
    recarregar,
    aplicarDecisao,
    cancelarRole,
    voltar,
  };
};
