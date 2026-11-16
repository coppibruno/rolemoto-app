"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { ComentarioAtividade } from "@/types/atividade";
import { inicioService } from "../services/inicio.service";

export const useComentariosAtividade = (
  atividadeId: string | null,
  onMudarTotal?: (delta: number) => void,
) => {
  const [itens, setItens] = useState<ComentarioAtividade[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!atividadeId) return;
    setCarregando(true);
    setErro(false);
    try {
      const pagina = await inicioService.comentarios(atividadeId, null);
      setItens(pagina.itens);
      setCursor(pagina.proximoCursor);
    } catch {
      setErro(true);
      setItens([]);
    } finally {
      setCarregando(false);
    }
  }, [atividadeId]);

  useEffect(() => {
    setItens([]);
    setCursor(null);
    if (atividadeId) void carregar();
  }, [atividadeId, carregar]);

  const carregarAnteriores = async () => {
    if (!atividadeId || !cursor || carregandoMais) return;
    setCarregandoMais(true);
    try {
      const pagina = await inicioService.comentarios(atividadeId, cursor);
      setItens((antes) => [...antes, ...pagina.itens]);
      setCursor(pagina.proximoCursor);
    } catch {
      setErro(true);
    } finally {
      setCarregandoMais(false);
    }
  };

  const enviar = async (texto: string): Promise<boolean> => {
    if (!atividadeId || enviando) return false;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const criado = await inicioService.comentar(atividadeId, texto);
      setItens((antes) => [criado, ...antes]);
      onMudarTotal?.(1);
      return true;
    } catch (e) {
      setErroEnvio(e instanceof ApiError ? e.message : "Não foi possível comentar.");
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const apagar = async (comentarioId: string) => {
    if (!atividadeId) return;
    try {
      await inicioService.apagarComentario(atividadeId, comentarioId);
      setItens((antes) => antes.filter((c) => c.id !== comentarioId));
      onMudarTotal?.(-1);
    } catch {
      setErroEnvio("Não foi possível apagar o comentário.");
    }
  };

  return {
    itens,
    cursor,
    carregando,
    carregandoMais,
    enviando,
    erro,
    erroEnvio,
    carregarAnteriores,
    enviar,
    apagar,
    recarregar: carregar,
  };
};
