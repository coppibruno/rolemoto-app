"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { geocodeService, type SugestaoEndereco } from "@/lib/geocode";
import type { StoryPublica } from "@/types/story-local";
import {
  POSICAO_LOCAL_PADRAO,
  POSICAO_MARCA_PADRAO,
  limitarPosicao,
  proximaCor,
  type CorSelo,
  type PosicaoMarca,
} from "../marca-story";
import {
  useMencoesStory,
  usePublicarStoryPerfil,
  type MencaoOpcao,
  type PontoMencao,
} from "./usePublicarStoryPerfil";

const DEBOUNCE_GEO_MS = 400;

type Params = {
  arquivo: File;
  marcaInicial: MencaoOpcao | null;
  onPublicada: (story: StoryPublica) => void;
};

export const useComposerStory = ({ arquivo, marcaInicial, onPublicada }: Params) => {
  const [escolhida, setEscolhida] = useState<MencaoOpcao | null>(marcaInicial);
  const [localizacao, setLocalizacao] = useState<PontoMencao | null>(null);
  const [posicao, setPosicao] = useState<PosicaoMarca>(POSICAO_MARCA_PADRAO);
  const [posicaoLocal, setPosicaoLocal] = useState<PosicaoMarca>(POSICAO_LOCAL_PADRAO);
  const [corMarca, setCorMarca] = useState<CorSelo>("neutro");
  const [corLocal, setCorLocal] = useState<CorSelo>("neutro");
  const [paletaAberta, setPaletaAberta] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [buscaLocal, setBuscaLocal] = useState(false);
  const [termo, setTermo] = useState("");
  const [termoLocal, setTermoLocal] = useState("");
  const [sugestoesGeo, setSugestoesGeo] = useState<SugestaoEndereco[]>([]);
  const [buscandoGeo, setBuscandoGeo] = useState(false);
  const [resolvendoLivre, setResolvendoLivre] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const posicaoRef = useRef(posicao);
  const posicaoLocalRef = useRef(posicaoLocal);
  const arraste = useRef<{
    id: number;
    x: number;
    y: number;
    origemX: number;
    origemY: number;
    moveu: boolean;
    alvo: "marca" | "local";
  } | null>(null);
  posicaoRef.current = posicao;
  posicaoLocalRef.current = posicaoLocal;
  const { opcoes, perto } = useMencoesStory(true);
  const { publicar, enviando, erro } = usePublicarStoryPerfil();

  useEffect(() => {
    const url = URL.createObjectURL(arquivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  useEffect(() => {
    if (!buscaLocal || termoLocal.trim().length < 3) {
      setSugestoesGeo([]);
      setBuscandoGeo(false);
      return;
    }
    const id = window.setTimeout(async () => {
      setBuscandoGeo(true);
      const itens = await geocodeService.buscar(termoLocal, {
        estiloLabel: "curto",
        restritoSul: false,
      });
      setSugestoesGeo(itens);
      setBuscandoGeo(false);
    }, DEBOUNCE_GEO_MS);
    return () => window.clearTimeout(id);
  }, [buscaLocal, termoLocal]);

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

  const fecharPaineis = () => {
    setPaletaAberta(false);
    setBuscaAberta(false);
    setBuscaLocal(false);
  };

  const escolher = (marca: MencaoOpcao) => {
    setEscolhida(marca);
    setPosicao(POSICAO_MARCA_PADRAO);
    setCorMarca("neutro");
    fecharPaineis();
    setTermo("");
  };

  const abrirPaleta = () => {
    setBuscaAberta(false);
    setBuscaLocal(false);
    setPaletaAberta((aberta) => !aberta);
  };

  const abrirBusca = () => {
    if (escolhida) return;
    setPaletaAberta(false);
    setBuscaLocal(false);
    setBuscaAberta(true);
  };

  const abrirLocalizacao = () => {
    if (localizacao) return;
    setPaletaAberta(false);
    setBuscaAberta(false);
    setBuscaLocal(true);
  };

  const escolherLocalizacao = (ponto: PontoMencao) => {
    setLocalizacao(ponto);
    setPosicaoLocal(POSICAO_LOCAL_PADRAO);
    setCorLocal("neutro");
    fecharPaineis();
    setTermoLocal("");
  };

  const escolherSugestaoGeo = (ponto: PontoMencao) => {
    escolherLocalizacao(ponto);
  };

  const escolherLocalizacaoLivre = async (nome: string) => {
    const limpo = nome.trim().slice(0, 80);
    if (!limpo || enviando || resolvendoLivre) return;
    setErroLocal(null);
    setResolvendoLivre(true);
    try {
      const itens = await geocodeService.buscar(limpo, {
        estiloLabel: "curto",
        restritoSul: false,
      });
      const primeiro = itens[0];
      if (!primeiro) {
        setErroLocal("Não achamos esse lugar. Tente outro nome.");
        return;
      }
      escolherLocalizacao({
        nome: (primeiro.label || limpo).slice(0, 80),
        lat: primeiro.lat,
        lng: primeiro.lng,
      });
    } catch {
      setErroLocal("Não foi possível buscar o lugar. Tente de novo.");
    } finally {
      setResolvendoLivre(false);
    }
  };

  const tirarLocalizacao = () => {
    setLocalizacao(null);
    setPosicaoLocal(POSICAO_LOCAL_PADRAO);
    setCorLocal("neutro");
  };

  const tirarMarca = () => {
    setEscolhida(null);
    setPosicao(POSICAO_MARCA_PADRAO);
    setCorMarca("neutro");
  };

  const aoSegurar = (alvo: "marca" | "local") => (evento: ReactPointerEvent<HTMLElement>) => {
    if (enviando || (evento.target as HTMLElement).closest("[data-tirar-marca]")) return;
    const stage = stageRef.current;
    if (!stage) return;
    evento.preventDefault();
    const atual = alvo === "marca" ? posicaoRef.current : posicaoLocalRef.current;
    arraste.current = {
      id: evento.pointerId,
      x: evento.clientX,
      y: evento.clientY,
      origemX: atual.x,
      origemY: atual.y,
      moveu: false,
      alvo,
    };
    try {
      evento.currentTarget.setPointerCapture(evento.pointerId);
    } catch {
      // O movimento continua no próprio selo quando o ponteiro já soltou.
    }
  };

  const aoMover = (evento: ReactPointerEvent<HTMLElement>) => {
    const atual = arraste.current;
    const stage = stageRef.current?.getBoundingClientRect();
    if (!atual || atual.id !== evento.pointerId || !stage || stage.width === 0 || stage.height === 0) {
      return;
    }
    const dxPx = evento.clientX - atual.x;
    const dyPx = evento.clientY - atual.y;
    if (!atual.moveu && Math.hypot(dxPx, dyPx) < 8) return;
    atual.moveu = true;
    const dx = (dxPx / stage.width) * 100;
    const dy = (dyPx / stage.height) * 100;
    const proxima = limitarPosicao(atual.origemX + dx, atual.origemY + dy);
    if (atual.alvo === "marca") setPosicao(proxima);
    else setPosicaoLocal(proxima);
  };

  const aoSoltar = (evento: ReactPointerEvent<HTMLElement>) => {
    const atual = arraste.current;
    if (!atual || atual.id !== evento.pointerId) return;
    arraste.current = null;
    if (atual.moveu || enviando) return;
    if (atual.alvo === "marca") setCorMarca((cor) => proximaCor(cor));
    else setCorLocal((cor) => proximaCor(cor));
  };

  const consultaLocal = termoLocal.trim().toLocaleLowerCase();
  const locais = useMemo(
    () => opcoes.filter((item) => item.tipo === "local" && item.ponto),
    [opcoes],
  );
  const listaLocal = useMemo(
    () => locais
      .filter((item) => !consultaLocal || item.nome.toLocaleLowerCase().includes(consultaLocal))
      .slice(0, 4),
    [consultaLocal, locais],
  );
  const listaGeo: PontoMencao[] = useMemo(
    () =>
      sugestoesGeo.map((item) => ({
        nome: item.label.slice(0, 80),
        lat: item.lat,
        lng: item.lng,
      })),
    [sugestoesGeo],
  );
  const lugarEncontro = useMemo(() => {
    if (escolhida?.tipo !== "evento") return null;
    if (escolhida.ponto) return escolhida.ponto;
    return opcoes.find((item) => item.tipo === "evento" && item.id === escolhida.id)?.ponto ?? null;
  }, [escolhida, opcoes]);
  const lugarVisivel = lugarEncontro &&
    (!consultaLocal || lugarEncontro.nome.toLocaleLowerCase().includes(consultaLocal))
    ? lugarEncontro
    : null;

  const enviar = async () => {
    const story = await publicar(arquivo, {
      mencao: escolhida,
      posicao: escolhida ? posicao : null,
      corMarca: escolhida ? corMarca : null,
      localizacao,
      posicaoLocal: localizacao ? posicaoLocal : null,
      corLocal: localizacao ? corLocal : null,
    });
    if (story) onPublicada(story);
  };

  return {
    preview,
    stageRef,
    escolhida,
    localizacao,
    posicao,
    posicaoLocal,
    corMarca,
    corLocal,
    paletaAberta,
    buscaAberta,
    buscaLocal,
    termo,
    setTermo,
    termoLocal,
    setTermoLocal,
    lista,
    listaLocal,
    listaGeo,
    lugarEncontro: lugarVisivel,
    perto: pertoVisivel ? perto : null,
    escolher,
    abrirPaleta,
    fecharPaineis,
    abrirBusca,
    abrirLocalizacao,
    escolherLocalizacao,
    escolherSugestaoGeo,
    escolherLocalizacaoLivre,
    buscandoGeo,
    resolvendoLivre,
    tirarMarca,
    tirarLocalizacao,
    aoSegurar,
    aoMover,
    aoSoltar,
    enviar,
    enviando,
    erro: erroLocal ?? erro,
    semResultado: buscaAberta && !pertoVisivel && lista.length === 0 && termo.trim().length > 0,
    semLocal:
      buscaLocal &&
      !buscandoGeo &&
      listaGeo.length === 0 &&
      listaLocal.length === 0 &&
      termoLocal.trim().length > 0 &&
      !lugarVisivel,
  };
};
