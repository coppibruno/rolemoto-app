"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { avisarNotificacoesMudaram } from "@/lib/eventos-notificacoes";
import type { NotificacaoInboxItem } from "@/types/notificacao";
import { notificacoesService } from "../services/notificacoes.service";

export const useNotificacoes = () => {
  const router = useRouter();
  const [itens, setItens] = useState<NotificacaoInboxItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const pagina = await notificacoesService.listar();
      setItens(pagina.itens);
      setCursor(pagina.nextCursor);
    } catch {
      setErro("erro");
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
      const pagina = await notificacoesService.listar(cursor);
      setItens((atuais) => [...atuais, ...pagina.itens]);
      setCursor(pagina.nextCursor);
    } catch {
      // Mantém o que já carregou.
    } finally {
      setCarregandoMais(false);
    }
  };

  const abrir = async (item: NotificacaoInboxItem) => {
    if (!item.lida) {
      setItens((atuais) =>
        atuais.map((linha) =>
          linha.id === item.id ? { ...linha, lida: true } : linha,
        ),
      );
      void notificacoesService.marcarLida(item.id).then(() => {
        avisarNotificacoesMudaram();
      });
    }
    router.push(item.url);
  };

  const marcarTodas = async () => {
    if (marcandoTodas) return;
    setMarcandoTodas(true);
    try {
      await notificacoesService.marcarTodas();
      setItens((atuais) => atuais.map((linha) => ({ ...linha, lida: true })));
      avisarNotificacoesMudaram();
    } finally {
      setMarcandoTodas(false);
    }
  };

  return {
    itens,
    carregando,
    carregandoMais,
    marcandoTodas,
    erro,
    temMais: Boolean(cursor),
    carregar,
    carregarMais,
    abrir,
    marcarTodas,
  };
};
