"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { StoryPublica } from "@/types/story-local";
import { POSICAO_MARCA_PADRAO, limitarPosicao, type PosicaoMarca } from "../marca-story";
import {
  useMencoesStory,
  usePublicarStoryPerfil,
  type MencaoOpcao,
} from "./usePublicarStoryPerfil";

type Params = {
  arquivo: File;
  marcaInicial: MencaoOpcao | null;
  onPublicada: (story: StoryPublica) => void;
};

export const useComposerStory = ({ arquivo, marcaInicial, onPublicada }: Params) => {
  const [escolhida, setEscolhida] = useState<MencaoOpcao | null>(marcaInicial);
  const [posicao, setPosicao] = useState<PosicaoMarca>(POSICAO_MARCA_PADRAO);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const posicaoRef = useRef(posicao);
  const arraste = useRef<{
    id: number;
    x: number;
    y: number;
    origemX: number;
    origemY: number;
  } | null>(null);
  posicaoRef.current = posicao;
  const { opcoes, perto } = useMencoesStory(true);
  const { publicar, enviando, erro } = usePublicarStoryPerfil();

  useEffect(() => {
    const url = URL.createObjectURL(arquivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  const consulta = termo.trim().toLocaleLowerCase();
  const pertoVisivel = Boolean(
    perto && (!consulta || perto.nome.toLocaleLowerCase().includes(consulta)),
  );
  const lista = useMemo(() => {
    const base = opcoes.filter((item) => !perto || item.tipo !== perto.tipo || item.id !== perto.id);
    return base
      .filter((item) => !consulta || item.nome.toLocaleLowerCase().includes(consulta))
      .slice(0, pertoVisivel ? 7 : 8);
  }, [consulta, opcoes, perto, pertoVisivel]);

  const escolher = (marca: MencaoOpcao) => {
    setEscolhida(marca);
    setPosicao(POSICAO_MARCA_PADRAO);
    setBuscaAberta(false);
    setTermo("");
  };

  const tirarMarca = () => {
    setEscolhida(null);
    setPosicao(POSICAO_MARCA_PADRAO);
  };

  const aoSegurarMarca = (evento: ReactPointerEvent<HTMLElement>) => {
    if (enviando || (evento.target as HTMLElement).closest("[data-tirar-marca]")) return;
    const stage = stageRef.current;
    if (!stage) return;
    evento.preventDefault();
    const atual = posicaoRef.current;
    arraste.current = {
      id: evento.pointerId,
      x: evento.clientX,
      y: evento.clientY,
      origemX: atual.x,
      origemY: atual.y,
    };
    try {
      evento.currentTarget.setPointerCapture(evento.pointerId);
    } catch {
      // O movimento continua no próprio selo quando o ponteiro já soltou.
    }
  };

  const aoMoverMarca = (evento: ReactPointerEvent<HTMLElement>) => {
    const atual = arraste.current;
    const stage = stageRef.current?.getBoundingClientRect();
    if (!atual || atual.id !== evento.pointerId || !stage || stage.width === 0 || stage.height === 0) {
      return;
    }
    const dx = ((evento.clientX - atual.x) / stage.width) * 100;
    const dy = ((evento.clientY - atual.y) / stage.height) * 100;
    setPosicao(limitarPosicao(atual.origemX + dx, atual.origemY + dy));
  };

  const aoSoltarMarca = (evento: ReactPointerEvent<HTMLElement>) => {
    if (arraste.current?.id === evento.pointerId) arraste.current = null;
  };

  const enviar = async () => {
    const story = await publicar(arquivo, escolhida, escolhida ? posicao : null);
    if (story) onPublicada(story);
  };

  return {
    preview,
    stageRef,
    escolhida,
    posicao,
    buscaAberta,
    setBuscaAberta,
    termo,
    setTermo,
    lista,
    perto: pertoVisivel ? perto : null,
    escolher,
    tirarMarca,
    aoSegurarMarca,
    aoMoverMarca,
    aoSoltarMarca,
    enviar,
    enviando,
    erro,
    semResultado: buscaAberta && !pertoVisivel && lista.length === 0 && termo.trim().length > 0,
  };
};
