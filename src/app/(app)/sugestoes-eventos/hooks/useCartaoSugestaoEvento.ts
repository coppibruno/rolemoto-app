"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import type { AcessoEvento, TipoEvento } from "@/types/evento";
import type { SugestaoEvento } from "@/types/sugestao-evento";
import {
  INFORMACOES_MAX,
  TITULO_MAX,
  TITULO_MIN,
} from "../../criar-evento/constants";
import { montarIsoEvento, MAX_DURACAO_EVENTO_MS } from "../../criar-evento/montar-iso-evento";
import { sugestoesEventosService } from "../services/sugestoes-eventos.service";
import { partirIsoEvento } from "../lib/partir-iso-evento";

const mensagemDe = (error: unknown): string =>
  error instanceof ApiError ? error.message : "Não foi possível concluir";

export const useCartaoSugestaoEvento = (
  sugestao: SugestaoEvento,
  onDecidida: (id: string) => void,
) => {
  const abertura = partirIsoEvento(sugestao.dataHoraAbertura);
  const fim = sugestao.dataHoraEncerramento
    ? partirIsoEvento(sugestao.dataHoraEncerramento)
    : null;
  const [titulo, setTitulo] = useState(sugestao.titulo);
  const [tipo, setTipo] = useState<TipoEvento>(sugestao.tipoSugerido);
  const [acesso, setAcesso] = useState<AcessoEvento>(sugestao.acesso);
  const [data, setData] = useState(abertura.data);
  const [hora, setHora] = useState(abertura.hora);
  const [temFim, setTemFim] = useState(Boolean(fim));
  const [dataFim, setDataFim] = useState(fim?.data ?? abertura.data);
  const [horaFim, setHoraFim] = useState(fim?.hora ?? abertura.hora);
  const [informacoes, setInformacoes] = useState(sugestao.informacoes);
  const [enviando, setEnviando] = useState<"homologar" | "recusar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const tituloLimpo = titulo.trim();
  const erroTitulo =
    tituloLimpo.length < TITULO_MIN || tituloLimpo.length > TITULO_MAX
      ? "Use de 3 a 80 caracteres"
      : undefined;
  const erroTexto =
    informacoes.trim().length > INFORMACOES_MAX ? "Texto longo demais" : undefined;

  const validarDatas = (): string | null => {
    if (!data || !hora) return "Informe a abertura";
    const inicio = Date.parse(montarIsoEvento(data, hora));
    if (Number.isNaN(inicio) || inicio <= Date.now()) {
      return "A abertura precisa ser no futuro";
    }
    if (!temFim) return null;
    if (!dataFim || !horaFim) return "Informe o encerramento";
    const final = Date.parse(montarIsoEvento(dataFim, horaFim));
    if (Number.isNaN(final) || final <= inicio) {
      return "O encerramento precisa ser depois da abertura";
    }
    if (final - inicio > MAX_DURACAO_EVENTO_MS) {
      return "O evento pode durar no máximo 7 dias";
    }
    return null;
  };

  const erroData = validarDatas();

  const homologar = async () => {
    if (enviando || erroTitulo || erroTexto || erroData || !sugestao.fotoCapaUrl) return;
    setEnviando("homologar");
    setErro(null);
    try {
      await sugestoesEventosService.aprovar(sugestao.id, {
        titulo: tituloLimpo,
        tipo,
        acesso,
        dataHoraAbertura: montarIsoEvento(data, hora),
        dataHoraEncerramento: temFim ? montarIsoEvento(dataFim, horaFim) : null,
        informacoes: informacoes.trim(),
      });
      onDecidida(sugestao.id);
    } catch (error) {
      setErro(mensagemDe(error));
      setEnviando(null);
    }
  };

  const recusar = async () => {
    if (enviando) return;
    setEnviando("recusar");
    setErro(null);
    try {
      await sugestoesEventosService.recusar(sugestao.id);
      onDecidida(sugestao.id);
    } catch (error) {
      setErro(mensagemDe(error));
      setEnviando(null);
    }
  };

  return {
    titulo,
    setTitulo,
    tipo,
    setTipo,
    acesso,
    setAcesso,
    data,
    setData,
    hora,
    setHora,
    temFim,
    setTemFim,
    dataFim,
    setDataFim,
    horaFim,
    setHoraFim,
    informacoes,
    setInformacoes,
    erroTitulo,
    erroTexto,
    erroData,
    enviando,
    erro,
    podeHomologar: !erroTitulo && !erroTexto && !erroData && Boolean(sugestao.fotoCapaUrl),
    homologar,
    recusar,
  };
};
