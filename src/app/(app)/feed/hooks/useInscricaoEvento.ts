"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { AcessoEvento } from "@/types/evento";
import {
  CONFIRMA_CANCELAR_INSCRICAO,
  ERRO_CANCELAR_INSCRICAO,
  ERRO_INSCRICAO_GENERICO,
  TOAST_INSCRICAO_MS,
  TOAST_INSCRICAO_OK,
} from "../constants";
import { inscricaoEventoService } from "../services/inscricao-evento.service";

type EventoInscricao = {
  id: string;
  acesso: AcessoEvento;
  linkIngresso: string | null;
  inscrito: boolean;
};

export const useInscricaoEvento = (evento: EventoInscricao) => {
  const [inscrito, setInscrito] = useState(evento.inscrito);
  const [enviando, setEnviando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setInscrito(evento.inscrito);
  }, [evento.id, evento.inscrito]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), TOAST_INSCRICAO_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  const fecharModal = useCallback(() => setModalAberto(false), []);

  const abrirModalIngresso = useCallback(() => {
    setModalAberto(true);
  }, []);

  const inscrever = useCallback(async () => {
    if (enviando || inscrito) return;
    setEnviando(true);
    setErro(null);
    try {
      await inscricaoEventoService.inscrever(evento.id);
      setInscrito(true);
      if (evento.acesso === "ingresso") {
        setModalAberto(true);
      } else {
        setToast(TOAST_INSCRICAO_OK);
      }
    } catch (e) {
      const mensagem =
        e instanceof ApiError ? e.message : ERRO_INSCRICAO_GENERICO;
      setErro(mensagem);
    } finally {
      setEnviando(false);
    }
  }, [enviando, inscrito, evento.id, evento.acesso]);

  const cancelar = useCallback(async () => {
    if (enviando || !inscrito) return;
    if (!window.confirm(CONFIRMA_CANCELAR_INSCRICAO)) return;
    setEnviando(true);
    setErro(null);
    try {
      await inscricaoEventoService.cancelar(evento.id);
      setInscrito(false);
      setModalAberto(false);
    } catch (e) {
      const mensagem =
        e instanceof ApiError ? e.message : ERRO_CANCELAR_INSCRICAO;
      setErro(mensagem);
    } finally {
      setEnviando(false);
    }
  }, [enviando, inscrito, evento.id]);

  return {
    inscrito,
    enviando,
    modalAberto,
    erro,
    toast,
    linkIngresso: evento.linkIngresso,
    acesso: evento.acesso,
    inscrever,
    cancelar,
    fecharModal,
    abrirModalIngresso,
  };
};
