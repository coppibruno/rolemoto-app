"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { avisarNaoLidasMudaram, ouvirPushRecebido } from "@/lib/eventos-mensagens";
import type { Mensagem, PessoaConversa } from "@/types/conversa";
import { juntarRecentes } from "../conversa";
import { mensagensService } from "../services/mensagens.service";

export const useConversa = (conversaId: string) => {
  const [outro, setOutro] = useState<PessoaConversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoAntigas, setCarregandoAntigas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const pagina = await mensagensService.listarMensagens(conversaId);
      setOutro(pagina.outro);
      setMensagens([...pagina.itens].reverse());
      setCursor(pagina.proximoCursor);
      avisarNaoLidasMudaram();
    } catch (falha) {
      setErro(
        falha instanceof ApiError && falha.status === 404
          ? "Conversa não encontrada."
          : "Não deu para carregar a conversa.",
      );
    } finally {
      setCarregando(false);
    }
  }, [conversaId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Sem leitura ao vivo: o push com o app aberto traz as mensagens novas.
  useEffect(
    () =>
      ouvirPushRecebido(() => {
        void mensagensService
          .listarMensagens(conversaId)
          .then((pagina) => {
            setMensagens((atuais) => juntarRecentes(atuais, [...pagina.itens].reverse()));
            avisarNaoLidasMudaram();
          })
          .catch(() => undefined);
      }),
    [conversaId],
  );

  const carregarAntigas = async () => {
    if (!cursor || carregandoAntigas) return;
    setCarregandoAntigas(true);
    try {
      const pagina = await mensagensService.listarMensagens(conversaId, cursor);
      setMensagens((atuais) => [...[...pagina.itens].reverse(), ...atuais]);
      setCursor(pagina.proximoCursor);
    } catch {
      setErro("Não deu para carregar a conversa.");
    } finally {
      setCarregandoAntigas(false);
    }
  };

  const enviar = async (texto: string): Promise<boolean> => {
    const limpo = texto.trim();
    if (!outro || !limpo || enviando) return false;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const resposta = await mensagensService.enviar({ destinatarioId: outro.uid, texto: limpo });
      setMensagens((atuais) => [...atuais, resposta.mensagem]);
      return true;
    } catch (falha) {
      setErroEnvio(falha instanceof ApiError ? falha.message : "Não deu para enviar.");
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const trocarCurtida = (mensagemId: string, curtida: boolean) =>
    setMensagens((atuais) =>
      atuais.map((m) => (m.id === mensagemId ? { ...m, curtida } : m)),
    );

  // Otimista: o coração aparece na hora e volta se a API recusar.
  const alternarCurtida = (mensagem: Mensagem) => {
    const curtida = !mensagem.curtida;
    trocarCurtida(mensagem.id, curtida);
    void mensagensService
      .curtir(conversaId, mensagem.id, curtida)
      .catch(() => trocarCurtida(mensagem.id, !curtida));
  };

  return {
    outro,
    mensagens,
    carregando,
    carregandoAntigas,
    temAntigas: Boolean(cursor),
    erro,
    enviando,
    erroEnvio,
    recarregar: carregar,
    carregarAntigas,
    enviar,
    alternarCurtida,
  };
};
