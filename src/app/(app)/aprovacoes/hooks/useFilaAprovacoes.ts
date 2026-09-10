"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  DecisaoPiloto,
  FilaAprovacoes,
  ResumoAprovacoes,
  SolicitacaoLider,
  StatusAprovacao,
} from "@/types/aprovacao";
import { ERRO_FILA } from "../constants";
import { aprovacoesService } from "../services/aprovacoes.service";

export type ChipRole = {
  id: string;
  titulo: string;
  count: number;
};

const RESUMO_ZERO: ResumoAprovacoes = {
  pendentes: 0,
  aceitos: 0,
  rolesComPendentes: 0,
  rolesComAceitos: 0,
};

const statusInicial = (valor: string | null): StatusAprovacao =>
  valor === "aceito" ? "aceito" : "pendente";

export const useFilaAprovacoes = () => {
  const searchParams = useSearchParams();
  const statusQuery = searchParams?.get("status") ?? null;
  const roleQuery = searchParams?.get("role") ?? null;
  const [status, setStatus] = useState<StatusAprovacao>(() =>
    statusInicial(statusQuery),
  );
  const [roleId, setRoleId] = useState<string | null>(() => roleQuery);
  const [fila, setFila] = useState<FilaAprovacoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useEffect(() => {
    setStatus(statusInicial(statusQuery));
    setRoleId(roleQuery);
  }, [statusQuery, roleQuery]);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    aprovacoesService
      .listar(status)
      .then((dados) => {
        if (!cancelado) setFila(dados);
      })
      .catch(() => {
        if (!cancelado) {
          setFila(null);
          setErro(ERRO_FILA);
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [status, ticket]);

  const chipsRole = useMemo<ChipRole[]>(() => {
    if (!fila) return [];
    const mapa = new Map<string, ChipRole>();
    for (const item of fila.itens) {
      const atual = mapa.get(item.role.id);
      if (atual) {
        atual.count += 1;
      } else {
        mapa.set(item.role.id, {
          id: item.role.id,
          titulo: item.role.titulo,
          count: 1,
        });
      }
    }
    return [...mapa.values()];
  }, [fila]);

  useEffect(() => {
    if (carregando || !fila) return;
    if (!roleId) return;
    if (!chipsRole.some((chip) => chip.id === roleId)) {
      setRoleId(null);
    }
  }, [carregando, fila, chipsRole, roleId]);

  const itensVisiveis = useMemo(() => {
    if (!fila) return [];
    if (!roleId) return fila.itens;
    return fila.itens.filter((item) => item.role.id === roleId);
  }, [fila, roleId]);

  const aplicarDecisao = useCallback(
    (item: SolicitacaoLider, decisao: DecisaoPiloto) => {
      setFila((atual) => {
        if (!atual) return atual;
        const restantes = atual.itens.filter((i) => i.id !== item.id);
        const aindaNoRole = restantes.some((i) => i.role.id === item.role.id);
        const resumo: ResumoAprovacoes = { ...atual.resumo };

        resumo.pendentes = Math.max(0, resumo.pendentes - 1);
        if (!aindaNoRole) {
          resumo.rolesComPendentes = Math.max(0, resumo.rolesComPendentes - 1);
        }
        if (decisao === "aceitar") {
          resumo.aceitos += 1;
        }

        const itens =
          decisao === "aceitar"
            ? restantes.map((i) =>
                i.role.id === item.role.id
                  ? {
                      ...i,
                      role: { ...i.role, confirmados: i.role.confirmados + 1 },
                    }
                  : i,
              )
            : restantes;

        return { resumo, itens };
      });
    },
    [],
  );

  const escolherStatus = useCallback((proximo: StatusAprovacao) => {
    setStatus(proximo);
  }, []);

  return {
    status,
    setStatus: escolherStatus,
    roleId,
    setRoleId,
    resumo: fila?.resumo ?? RESUMO_ZERO,
    itens: itensVisiveis,
    chipsRole,
    carregando,
    erro,
    recarregar,
    aplicarDecisao,
  };
};
