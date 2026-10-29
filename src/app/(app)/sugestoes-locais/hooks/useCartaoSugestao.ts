"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import type { CategoriaLocal, HorarioDiaForm, HorarioDiaLocal } from "@/types/local";
import type { SugestaoLocal } from "@/types/sugestao-local";
import { ENDERECO_MIN, NOME_MAX, NOME_MIN } from "../../criar-local/constants";
import { horariosPadraoEspecifico } from "../../criar-local/horarios-padrao";
import { sugestoesLocaisService } from "../services/sugestoes-locais.service";

const paraForm = (horarios: HorarioDiaLocal[]): HorarioDiaForm[] =>
  horarios.map((dia) => ({
    dia: dia.dia,
    fechado: dia.fechado,
    abertura: dia.abertura ?? "08:00",
    fechamento: dia.fechamento ?? "18:00",
  }));

const paraApi = (dias: HorarioDiaForm[]): HorarioDiaLocal[] =>
  [...dias]
    .sort((a, b) => a.dia - b.dia)
    .map((dia) => ({
      dia: dia.dia,
      fechado: dia.fechado,
      abertura: dia.fechado ? null : dia.abertura,
      fechamento: dia.fechado ? null : dia.fechamento,
    }));

const mensagemDe = (error: unknown): string =>
  error instanceof ApiError ? error.message : "Não foi possível concluir";

export const useCartaoSugestao = (sugestao: SugestaoLocal, onDecidida: (id: string) => void) => {
  const [nome, setNome] = useState(sugestao.nome);
  const [endereco, setEndereco] = useState(sugestao.endereco);
  const [categoria, setCategoria] = useState<CategoriaLocal>(sugestao.categoriaSugerida);
  const [aberto24h, setAberto24h] = useState(
    sugestao.horarioCompleto ? sugestao.aberto24h : false,
  );
  const [horarios, setHorarios] = useState<HorarioDiaForm[]>(() =>
    sugestao.horarios.length > 0 ? paraForm(sugestao.horarios) : horariosPadraoEspecifico(),
  );
  const [horarioDefinido, setHorarioDefinido] = useState(sugestao.horarioCompleto);
  const [enviando, setEnviando] = useState<"homologar" | "recusar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const mudarModo = (valor: boolean) => {
    setAberto24h(valor);
    setHorarioDefinido(true);
  };

  const mudarDia = (dia: HorarioDiaForm["dia"], patch: Partial<HorarioDiaForm>) => {
    setHorarioDefinido(true);
    setHorarios((atual) =>
      atual.map((item) => (item.dia === dia ? { ...item, ...patch } : item)),
    );
  };

  const nomeLimpo = nome.trim();
  const enderecoLimpo = endereco.trim();
  const erroNome =
    nomeLimpo.length < NOME_MIN || nomeLimpo.length > NOME_MAX
      ? "Use de 3 a 80 caracteres"
      : undefined;
  const erroEndereco = enderecoLimpo.length < ENDERECO_MIN ? "Informe o endereço" : undefined;
  const textoValido = !erroNome && !erroEndereco;

  const homologar = async () => {
    if (enviando || (!sugestao.horarioCompleto && !horarioDefinido) || !textoValido) return;
    setEnviando("homologar");
    setErro(null);
    try {
      await sugestoesLocaisService.aprovar(sugestao.id, {
        nome: nomeLimpo,
        endereco: enderecoLimpo,
        categoria,
        aberto24h,
        horarios: aberto24h ? [] : paraApi(horarios),
        facilidades: [],
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
      await sugestoesLocaisService.recusar(sugestao.id);
      onDecidida(sugestao.id);
    } catch (error) {
      setErro(mensagemDe(error));
      setEnviando(null);
    }
  };

  return {
    nome,
    setNome,
    endereco,
    setEndereco,
    erroNome,
    erroEndereco,
    categoria,
    setCategoria,
    aberto24h,
    horarios,
    mudarModo,
    mudarDia,
    enviando,
    erro,
    homologar,
    recusar,
    podeHomologar: (sugestao.horarioCompleto || horarioDefinido) && textoValido,
  };
};
