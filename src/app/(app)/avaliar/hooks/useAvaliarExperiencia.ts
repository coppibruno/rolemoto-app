"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import type {
  AvaliacaoCreate,
  AvaliacaoExperiencia,
  TipoAlvoAvaliacao,
} from "@/types/avaliacao-experiencia";
import type { Evento } from "@/types/evento";
import type { Local } from "@/types/local";
import {
  DURACAO_ENVIADO_MS,
  ERRO_AINDA_GRADE,
  ERRO_CARREGAR,
  ERRO_NAO_ENCONTRADO,
  ERRO_SALVAR,
  ERRO_SEM_INSCRICAO,
  type ErroTelaAvaliar,
} from "../constants";
import { avaliacaoService } from "../services/avaliacao.service";

export type VisaoAvaliar = "form" | "lista" | "enviado";

export type AlvoAvaliacao =
  | { tipo: "local"; dados: Local & { avaliado?: boolean } }
  | {
      tipo: "evento";
      dados: Evento & { avaliado?: boolean; inscrito?: boolean };
    };

const eventoEncerrou = (evento: Evento): boolean => {
  const limite = evento.dataHoraEncerramento ?? evento.dataHoraAbertura;
  return Date.parse(limite) <= Date.now();
};

export const useAvaliarExperiencia = (
  tipo: TipoAlvoAvaliacao,
  alvoId: string,
) => {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [alvo, setAlvo] = useState<AlvoAvaliacao | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoExperiencia[]>([]);
  const [visao, setVisao] = useState<VisaoAvaliar>("form");
  const [erro, setErro] = useState<ErroTelaAvaliar | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [ticket, setTicket] = useState(0);

  useEffect(() => {
    if (!uid) return;

    let cancelado = false;
    setCarregando(true);
    setErro(null);
    setErroEnvio(null);

    const carregar = async () => {
      try {
        const [obtido, minha, lista] = await Promise.all([
          avaliacaoService.buscarAlvo(tipo, alvoId),
          avaliacaoService.buscarMinha(tipo, alvoId),
          avaliacaoService.listar(tipo, alvoId),
        ]);
        if (cancelado) return;

        if (tipo === "evento") {
          const evento = obtido as Evento & {
            avaliado?: boolean;
            inscrito?: boolean;
          };
          if (evento.inscrito === false) {
            setAlvo({ tipo: "evento", dados: evento });
            setErro(ERRO_SEM_INSCRICAO);
            return;
          }
          if (!eventoEncerrou(evento) && !minha) {
            setAlvo({ tipo: "evento", dados: evento });
            setErro(ERRO_AINDA_GRADE);
            return;
          }
          setAlvo({ tipo: "evento", dados: evento });
        } else {
          setAlvo({
            tipo: "local",
            dados: obtido as Local & { avaliado?: boolean },
          });
        }

        setAvaliacoes(lista);
        setVisao(minha ? "lista" : "form");
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
          setErro(ERRO_SEM_INSCRICAO);
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
  }, [alvoId, tipo, uid, router, ticket]);

  const recarregar = useCallback(() => setTicket((n) => n + 1), []);

  const voltar = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }, [router]);

  const voltarAoFeed = useCallback(() => {
    router.push("/");
  }, [router]);

  const enviar = useCallback(
    async (dados: AvaliacaoCreate) => {
      if (enviando) return;
      setEnviando(true);
      setErroEnvio(null);
      try {
        await avaliacaoService.publicar(tipo, alvoId, dados);
        const lista = await avaliacaoService.listar(tipo, alvoId);
        setAvaliacoes(lista);
        setVisao("enviado");
        window.setTimeout(() => setVisao("lista"), DURACAO_ENVIADO_MS);
      } catch (falha) {
        if (falha instanceof ApiError && falha.status === 409) {
          try {
            const lista = await avaliacaoService.listar(tipo, alvoId);
            setAvaliacoes(lista);
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
    [alvoId, enviando, tipo],
  );

  return {
    uid,
    carregando,
    enviando,
    alvo,
    avaliacoes,
    visao,
    erro,
    erroEnvio,
    recarregar,
    voltar,
    voltarAoFeed,
    enviar,
  };
};
