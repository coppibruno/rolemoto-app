"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AlvoPlayer, StoryPublica } from "@/types/story-local";
import { alvoDaStory } from "@/types/story-local";
import { engolirCliqueAtras, useCamadaCheia } from "../camada-cheia";
import type { DirecaoPessoaStory } from "../pessoas-story";
import { recarregarTemStories } from "./useTemStories";
import { precarregarFotoStory } from "../cache-foto-story";
import { mesclarStories } from "../marca-story";
import { storiesService } from "../services/stories.service";

const DURACAO_MS = 5000;
const LIMIAR_ARRASTE = 64;
const LIMIAR_TOQUE = 18;

type Params = {
  aberto: boolean;
  alvo: AlvoPlayer | null;
  destaqueId?: string | null;
  inicial?: StoryPublica | null;
  comecarNoFim?: boolean;
  onTrocarPessoa?: (direcao: DirecaoPessoaStory) => boolean;
  onFechar: () => void;
  onMudou?: () => void;
};

export const useReelStories = ({
  aberto,
  alvo,
  destaqueId,
  inicial,
  comecarNoFim = false,
  onTrocarPessoa,
  onFechar,
  onMudou,
}: Params) => {
  const { firebaseUser } = useAuth();
  const [montado, setMontado] = useState(false);
  const [stories, setStories] = useState<StoryPublica[]>([]);
  const [indice, setIndice] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [midiaProntaId, setMidiaProntaId] = useState<string | null>(null);
  const [deslocamento, setDeslocamento] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [ciclo, setCiclo] = useState(0);
  const progressoRef = useRef(0);
  const indiceRef = useRef(0);
  const storiesRef = useRef(stories);
  const segurouEm = useRef(0);
  const segurando = useRef(false);
  const avancoPendente = useRef(false);
  const confirmandoRef = useRef(false);
  const toqueRef = useRef({ x: 0, y: 0, esquerda: 0, largura: 0, dx: 0, dy: 0 });
  const onFecharRef = useRef(onFechar);
  const onTrocarRef = useRef(onTrocarPessoa);
  const inicialRef = useRef(inicial ?? null);
  onFecharRef.current = onFechar;
  onTrocarRef.current = onTrocarPessoa;
  inicialRef.current = inicial ?? null;
  indiceRef.current = indice;
  storiesRef.current = stories;
  confirmandoRef.current = confirmando;

  useCamadaCheia(aberto);

  const alvoTipo = alvo?.tipo ?? "";
  const alvoId = alvo?.id ?? "";

  useLayoutEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto || !alvoId || (alvoTipo !== "local" && alvoTipo !== "evento" && alvoTipo !== "usuario")) {
      return;
    }
    const alvoAtual: AlvoPlayer = { tipo: alvoTipo, id: alvoId };
    const fotoInicial = inicialRef.current;
    let cancelado = false;
    setCarregando(true);
    setErro(false);
    setConfirmando(false);
    setPausado(false);
    setStories(fotoInicial ? [fotoInicial] : []);
    storiesService
      .listar(alvoAtual)
      .then((lista) => {
        if (cancelado) return;
        setErro(false);
        const ordenada = mesclarStories(lista.stories, fotoInicial);
        const achou = destaqueId
          ? ordenada.findIndex((item) => item.id === destaqueId)
          : 0;
        const noComeco = achou >= 0 ? achou : 0;
        const proximo = !destaqueId && comecarNoFim
          ? Math.max(0, ordenada.length - 1)
          : noComeco;
        for (let i = Math.max(0, proximo - 1); i <= Math.min(ordenada.length - 1, proximo + 2); i += 1) {
          precarregarFotoStory(ordenada[i].fotoUrl);
        }
        setStories(ordenada);
        setIndice(proximo);
        progressoRef.current = 0;
        setProgresso(0);
      })
      .catch(() => {
        if (cancelado) return;
        const mantida = inicialRef.current;
        setErro(true);
        setStories(mantida ? [mantida] : []);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [aberto, alvoTipo, alvoId, destaqueId, tentativa, inicial?.id, comecarNoFim]);

  const avancar = useCallback(() => {
    if (avancoPendente.current) return;
    avancoPendente.current = true;
    const proximo = indiceRef.current + 1;
    if (proximo >= storiesRef.current.length) {
      if (onTrocarRef.current?.("proxima")) return;
      onFecharRef.current();
      return;
    }
    setIndice(proximo);
  }, []);

  const voltar = useCallback(() => {
    if (avancoPendente.current) return;
    if (indiceRef.current > 0) {
      avancoPendente.current = true;
      setIndice((atual) => Math.max(0, atual - 1));
      return;
    }
    if (onTrocarRef.current?.("anterior")) {
      avancoPendente.current = true;
      return;
    }
    progressoRef.current = 0;
    setProgresso(0);
    setCiclo((atual) => atual + 1);
  }, []);

  const marcarMidiaPronta = useCallback((id: string) => {
    setMidiaProntaId(id);
  }, []);

  const story = stories[indice] ?? null;
  const midiaPronta = story?.id === midiaProntaId;

  useEffect(() => {
    avancoPendente.current = false;
    progressoRef.current = 0;
    setProgresso(0);
    if (!segurando.current) setPausado(false);
  }, [indice, alvoId]);

  useEffect(() => {
    if (!aberto || pausado || confirmando || carregando || !midiaPronta || stories.length === 0) return;
    const restante = ((100 - progressoRef.current) / 100) * DURACAO_MS;
    const fim = performance.now() + restante;
    let encerrado = false;
    const id = window.setInterval(() => {
      if (encerrado) return;
      const pct = Math.min(100, 100 - ((fim - performance.now()) / DURACAO_MS) * 100);
      progressoRef.current = pct;
      setProgresso(pct);
      if (pct >= 100) {
        encerrado = true;
        window.clearInterval(id);
        avancar();
      }
    }, 50);
    return () => {
      encerrado = true;
      window.clearInterval(id);
    };
  }, [aberto, pausado, confirmando, carregando, midiaPronta, stories.length, indice, ciclo, avancar]);

  const storyId = story?.id ?? "";

  useEffect(() => {
    if (!aberto) return;
    const de = Math.max(0, indice - 1);
    const ate = Math.min(stories.length - 1, indice + 2);
    for (let i = de; i <= ate; i += 1) {
      const url = stories[i]?.fotoUrl;
      if (url) precarregarFotoStory(url);
    }
  }, [aberto, indice, stories]);

  useEffect(() => {
    if (!aberto || !storyId || !story) return;
    if (alvoTipo === "usuario" && alvoId) {
      storiesService.visto({ tipo: "usuario", id: alvoId }, storyId).catch(() => undefined);
      return;
    }
    const alvoStory = alvoDaStory(story);
    if (!alvoStory) return;
    storiesService.visto(alvoStory, storyId).catch(() => undefined);
  }, [aberto, storyId, story, alvoTipo, alvoId]);

  const finalizarToque = useCallback((x: number) => {
    if (!segurando.current) return;
    segurando.current = false;
    const durou = performance.now() - segurouEm.current;
    const toque = toqueRef.current;
    const dx = x - toque.x;
    const dy = toque.dy;
    setArrastando(false);
    setDeslocamento(0);
    setPausado(false);
    if (confirmandoRef.current) return;
    if (Math.abs(dx) >= LIMIAR_ARRASTE && Math.abs(dx) > Math.abs(dy)) {
      onTrocarRef.current?.(dx < 0 ? "proxima" : "anterior");
      return;
    }
    if (
      durou > 220
      || confirmandoRef.current
      || Math.abs(dx) > LIMIAR_TOQUE
      || Math.abs(dy) > LIMIAR_TOQUE
    ) {
      return;
    }
    if (x - toque.esquerda < toque.largura / 2) voltar();
    else avancar();
  }, [avancar, voltar]);

  const segurar = (evento: ReactPointerEvent<HTMLDivElement>) => {
    if (confirmandoRef.current) return;
    if (evento.cancelable) evento.preventDefault();
    evento.stopPropagation();
    const rect = evento.currentTarget.getBoundingClientRect();
    toqueRef.current = {
      x: evento.clientX,
      y: evento.clientY,
      esquerda: rect.left,
      largura: rect.width,
      dx: 0,
      dy: 0,
    };
    try {
      evento.currentTarget.setPointerCapture(evento.pointerId);
    } catch {
      // o ponteiro já encerrou
    }
    segurando.current = true;
    segurouEm.current = performance.now();
    setPausado(true);
  };

  const mover = (evento: ReactPointerEvent<HTMLDivElement>) => {
    if (!segurando.current || !onTrocarRef.current) return;
    const dx = evento.clientX - toqueRef.current.x;
    const dy = evento.clientY - toqueRef.current.y;
    toqueRef.current.dx = dx;
    toqueRef.current.dy = dy;
    if (Math.abs(dx) <= LIMIAR_TOQUE || Math.abs(dx) <= Math.abs(dy)) {
      setArrastando(false);
      setDeslocamento(0);
      return;
    }
    setArrastando(true);
    setDeslocamento(dx);
  };

  const soltar = (evento: ReactPointerEvent<HTMLDivElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
    finalizarToque(evento.clientX);
  };

  const cancelarToque = () => {
    segurando.current = false;
    setArrastando(false);
    setDeslocamento(0);
    setPausado(false);
  };

  useEffect(() => {
    if (!aberto) {
      avancoPendente.current = false;
      return;
    }
    const noPlayer = (evento: Event) => {
      const raiz = document.querySelector("[data-player-stories]");
      return Boolean(raiz && evento.target instanceof Node && raiz.contains(evento.target));
    };
    const bloquearFora = (evento: Event) => {
      if (noPlayer(evento)) return;
      evento.preventDefault();
      evento.stopPropagation();
    };
    const aoSoltarJanela = (evento: PointerEvent) => {
      if (!segurando.current) return;
      finalizarToque(evento.clientX);
    };
    const aoSoltarToque = (evento: TouchEvent) => {
      if (!segurando.current) return;
      const ponto = evento.changedTouches[0];
      if (!ponto) {
        cancelarToque();
        return;
      }
      finalizarToque(ponto.clientX);
    };
    const aoCancelarJanela = () => {
      if (!segurando.current) return;
      cancelarToque();
    };
    const aoPointerDown = (evento: Event) => {
      engolirCliqueAtras(document.querySelector("[data-player-stories]"));
      bloquearFora(evento);
    };
    const toqueAtivo = { capture: true, passive: false } as const;
    window.addEventListener("pointerup", aoSoltarJanela, true);
    window.addEventListener("pointercancel", aoCancelarJanela, true);
    window.addEventListener("touchend", aoSoltarToque, true);
    window.addEventListener("touchcancel", aoCancelarJanela, true);
    document.addEventListener("pointerdown", aoPointerDown, true);
    document.addEventListener("touchstart", aoPointerDown, toqueAtivo);
    document.addEventListener("pointerup", bloquearFora, true);
    document.addEventListener("click", bloquearFora, true);
    document.addEventListener("touchend", bloquearFora, toqueAtivo);
    return () => {
      segurando.current = false;
      window.removeEventListener("pointerup", aoSoltarJanela, true);
      window.removeEventListener("pointercancel", aoCancelarJanela, true);
      window.removeEventListener("touchend", aoSoltarToque, true);
      window.removeEventListener("touchcancel", aoCancelarJanela, true);
      document.removeEventListener("pointerdown", aoPointerDown, true);
      document.removeEventListener("touchstart", aoPointerDown, toqueAtivo);
      document.removeEventListener("pointerup", bloquearFora, true);
      document.removeEventListener("click", bloquearFora, true);
      document.removeEventListener("touchend", bloquearFora, toqueAtivo);
    };
  }, [aberto, finalizarToque]);

  const apagar = async () => {
    const alvoStory = story ? alvoDaStory(story) : null;
    if (!story || !alvoStory || apagando) return;
    setApagando(true);
    try {
      await storiesService.apagar(alvoStory, story.id);
      const restantes = stories.filter((item) => item.id !== story.id);
      void recarregarTemStories(story.autor.uid);
      onMudou?.();
      setConfirmando(false);
      if (restantes.length === 0) {
        onFechar();
        return;
      }
      setStories(restantes);
      setIndice((atual) => Math.min(atual, restantes.length - 1));
    } finally {
      setApagando(false);
    }
  };

  return {
    montado,
    stories,
    indice,
    progresso,
    carregando,
    erro,
    tentarDeNovo: () => setTentativa((atual) => atual + 1),
    confirmando,
    setConfirmando,
    apagando,
    story,
    midiaPronta,
    marcarMidiaPronta,
    minha: Boolean(story && firebaseUser?.uid === story.autor.uid),
    segurar,
    mover,
    soltar,
    cancelarToque,
    deslocamento,
    arrastando,
    apagar,
  };
};
