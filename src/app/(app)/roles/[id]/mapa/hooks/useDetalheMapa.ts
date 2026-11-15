"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { lembrarUrlDoSite } from "@/lib/mapa-viagem/plataforma";
import { pontosDoRole } from "@/lib/mapa-viagem/viagem";
import type { RoleDetalhe } from "@/types/role";
import { participacaoService } from "../../participar/services/participacao.service";
import { ERRO_CARREGAR, ERRO_NAO_ENCONTRADO } from "../constants";

export const useDetalheMapa = (roleId: string) => {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;
  const [detalhe, setDetalhe] = useState<RoleDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  useEffect(() => {
    void lembrarUrlDoSite();
  }, []);

  useEffect(() => {
    if (!uid) return;
    let ativo = true;
    setErro(null);
    participacaoService
      .buscarDetalhe(roleId)
      .then((obtido) => {
        if (ativo) setDetalhe(obtido);
      })
      .catch((falha) => {
        if (!ativo) return;
        setErro(falha instanceof ApiError && falha.status === 404 ? ERRO_NAO_ENCONTRADO : ERRO_CARREGAR);
      });
    return () => {
      ativo = false;
    };
  }, [roleId, uid, ticket]);

  const viagem = useMemo(
    () =>
      detalhe
        ? {
            roleId: detalhe.id,
            titulo: detalhe.titulo,
            dataHoraSaida: detalhe.dataHoraSaida,
            pontos: pontosDoRole(detalhe),
          }
        : null,
    [detalhe],
  );

  const podeBaixar = Boolean(
    detalhe && uid && (detalhe.criadorId === uid || detalhe.minhaParticipacao?.aceito === true),
  );

  return { detalhe, viagem, podeBaixar, erro, carregando: !detalhe && !erro, recarregar };
};
