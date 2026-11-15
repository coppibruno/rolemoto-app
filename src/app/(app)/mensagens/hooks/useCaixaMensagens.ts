"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConversaItem } from "@/types/conversa";
import { mensagensService } from "../services/mensagens.service";

export const useCaixaMensagens = () => {
  const [itens, setItens] = useState<ConversaItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const pagina = await mensagensService.listarConversas();
      setItens(pagina.itens);
      setCursor(pagina.proximoCursor);
    } catch {
      setErro("Não deu para carregar as mensagens.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const carregarMais = async () => {
    if (!cursor || carregandoMais) return;
    setCarregandoMais(true);
    try {
      const pagina = await mensagensService.listarConversas(cursor);
      setItens((atuais) => [...atuais, ...pagina.itens]);
      setCursor(pagina.proximoCursor);
    } catch {
      setErro("Não deu para carregar as mensagens.");
    } finally {
      setCarregandoMais(false);
    }
  };

  return {
    itens,
    carregando,
    carregandoMais,
    erro,
    temMais: Boolean(cursor),
    recarregar: carregar,
    carregarMais,
  };
};
