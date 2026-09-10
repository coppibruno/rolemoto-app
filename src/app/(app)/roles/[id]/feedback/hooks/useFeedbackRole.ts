"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CHAVE_FEEDBACK_ENTRADA_CHECADA } from "@/app/(app)/constants/feedback-sessao";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import type { RoleDetalhe } from "@/types/role";
import type {
  FeedbackCreate,
  UsuarioRoleFeedback,
} from "@/types/usuario-role-feedback";
import {
  DURACAO_ENVIADO_MS,
  ERRO_AINDA_GRADE,
  ERRO_CARREGAR,
  ERRO_FORA_COMBOIO,
  ERRO_NAO_ENCONTRADO,
  ERRO_SALVAR,
  type ErroTelaFeedback,
} from "../constants";
import { feedbackService } from "../services/feedback.service";

export type VisaoFeedback = "form" | "lista" | "enviado";

const marcarSessaoChecada = () => {
  try {
    sessionStorage.setItem(CHAVE_FEEDBACK_ENTRADA_CHECADA, "1");
  } catch {
    /* sessionStorage indisponível */
  }
};

const saidaPassou = (iso: string): boolean => Date.parse(iso) <= Date.now();

export const useFeedbackRole = (roleId: string) => {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [detalhe, setDetalhe] = useState<RoleDetalhe | null>(null);
  const [relatos, setRelatos] = useState<UsuarioRoleFeedback[]>([]);
  const [visao, setVisao] = useState<VisaoFeedback>("form");
  const [erro, setErro] = useState<ErroTelaFeedback | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  useEffect(() => {
    marcarSessaoChecada();
  }, []);

  useEffect(() => {
    if (!uid) return;

    let cancelado = false;
    setCarregando(true);
    setErro(null);
    setErroEnvio(null);

    const carregar = async () => {
      try {
        const [obtido, lista] = await Promise.all([
          feedbackService.buscarDetalhe(roleId),
          feedbackService.listar(roleId),
        ]);
        if (cancelado) return;

        if (!saidaPassou(obtido.dataHoraSaida)) {
          setDetalhe(obtido);
          setErro(ERRO_AINDA_GRADE);
          return;
        }

        const meuRelato = lista.find((item) => item.usuarioId === uid);
        setDetalhe(obtido);
        setRelatos(lista);
        setVisao(obtido.criadorId === uid || meuRelato ? "lista" : "form");
      } catch (falha) {
        if (cancelado) return;
        if (falha instanceof ApiError && falha.status === 401) {
          router.replace("/login");
          return;
        }
        if (falha instanceof ApiError && falha.status === 404) {
          setErro(ERRO_NAO_ENCONTRADO);
          return;
        }
        if (falha instanceof ApiError && falha.status === 403) {
          setErro(ERRO_FORA_COMBOIO);
          return;
        }
        setErro(ERRO_CARREGAR);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    void carregar();
    return () => {
      cancelado = true;
    };
  }, [roleId, uid, router, ticket]);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  const voltarAoFeed = useCallback(() => {
    router.push("/");
  }, [router]);

  const pular = useCallback(() => {
    marcarSessaoChecada();
    router.replace("/");
  }, [router]);

  const enviar = useCallback(
    async (dados: FeedbackCreate) => {
      if (enviando) return;
      setEnviando(true);
      setErroEnvio(null);
      try {
        await feedbackService.enviar(roleId, dados);
        const lista = await feedbackService.listar(roleId);
        setRelatos(lista);
        setVisao("enviado");
        window.setTimeout(() => setVisao("lista"), DURACAO_ENVIADO_MS);
      } catch (falha) {
        if (falha instanceof ApiError && falha.status === 409) {
          try {
            const lista = await feedbackService.listar(roleId);
            setRelatos(lista);
          } catch {
            /* lista fica como está */
          }
          setVisao("lista");
          return;
        }
        setErroEnvio(falha instanceof ApiError ? falha.message : ERRO_SALVAR);
      } finally {
        setEnviando(false);
      }
    },
    [enviando, roleId],
  );

  return {
    uid,
    carregando,
    enviando,
    detalhe,
    relatos,
    visao,
    erro,
    erroEnvio,
    recarregar,
    voltarAoFeed,
    pular,
    enviar,
  };
};
