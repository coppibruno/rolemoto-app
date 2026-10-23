"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
} from "react";
import type { MencaoStory, StoryPublica } from "@/types/story-local";
import { urlAbrirMaps } from "@/lib/maps";
import { fotoStoryPronta, registrarFotoStory } from "@/app/(app)/stories/cache-foto-story";
import { estiloMarca } from "@/app/(app)/stories/marca-story";
import styles from "./player-stories.module.css";

type Props = {
  story: StoryPublica;
  onPronta: (storyId: string) => void;
  onSegurar: () => void;
  onSoltar: (evento: ReactPointerEvent<HTMLDivElement>) => void;
  onCancelar: () => void;
  onMarca: (mencao: MencaoStory) => void;
};

const revelarFoto = (img: HTMLImageElement, url: string, aoPronta: () => void) => {
  if (img.naturalWidth === 0) return;
  void img
    .decode()
    .then(() => {
      registrarFotoStory(url);
      aoPronta();
    })
    .catch(aoPronta);
};

export const PalcoFotoStory = ({
  story,
  onPronta,
  onSegurar,
  onSoltar,
  onCancelar,
  onMarca,
}: Props) => {
  const mencao = story.mencao;
  const ofuscadaRef = useRef<HTMLImageElement>(null);
  const [prontaId, setProntaId] = useState<string | null>(null);
  const [falhouId, setFalhouId] = useState<string | null>(null);
  const revelando = prontaId === story.id;
  const naMemoria = fotoStoryPronta(story.fotoUrl) && !revelando;
  const pronta = naMemoria || revelando;
  const falhou = falhouId === story.id;
  const classeFoto = naMemoria
    ? `${styles.foto} ${styles.fotoPronta}`
    : revelando
      ? `${styles.foto} ${styles.fotoRevelar}`
      : `${styles.foto} ${styles.fotoOfuscada}`;

  useLayoutEffect(() => {
    const id = story.id;
    const url = story.fotoUrl;
    if (falhouId === id) {
      onPronta(id);
      return;
    }
    if (fotoStoryPronta(url) || prontaId === id) {
      onPronta(id);
      return;
    }
    const img = ofuscadaRef.current;
    if (!img?.complete || img.naturalWidth === 0) return;
    let ativo = true;
    revelarFoto(img, url, () => {
      if (ativo) setProntaId(id);
    });
    return () => {
      ativo = false;
    };
  }, [falhouId, onPronta, prontaId, story.id, story.fotoUrl]);

  const aoCarregar = (evento: SyntheticEvent<HTMLImageElement>) => {
    const id = story.id;
    revelarFoto(evento.currentTarget, story.fotoUrl, () => setProntaId(id));
  };

  const aoFalhar = () => {
    setFalhouId(story.id);
  };

  return (
    <div
      className={styles.palco}
      onPointerDown={onSegurar}
      onPointerUp={onSoltar}
      onPointerCancel={onCancelar}
    >
      {falhou ? null : (
        <img
          key={story.id}
          ref={ofuscadaRef}
          src={story.fotoUrl}
          alt=""
          draggable={false}
          className={classeFoto}
          onLoad={aoCarregar}
          onError={aoFalhar}
        />
      )}
      {mencao ? (
        <button
          type="button"
          className={styles.selo}
          style={estiloMarca(
            story.marcaX != null && story.marcaY != null
              ? { x: story.marcaX, y: story.marcaY }
              : null,
          )}
          aria-label={`Abrir ${mencao.nome}`}
          onPointerDown={(evento) => evento.stopPropagation()}
          onPointerUp={(evento) => evento.stopPropagation()}
          onClick={() => onMarca(mencao)}
        >
          @{mencao.nome}
        </button>
      ) : null}
      {story.localizacao ? (
        <a
          className={styles.localizacao}
          href={urlAbrirMaps({
            lat: story.localizacao.lat,
            lng: story.localizacao.lng,
            nome: story.localizacao.nome,
            endereco: "",
          })}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${story.localizacao.nome} no Maps`}
          onPointerDown={(evento) => evento.stopPropagation()}
          onPointerUp={(evento) => evento.stopPropagation()}
          onClick={(evento) => evento.stopPropagation()}
        >
          <span className="material-symbols-outlined" aria-hidden>
            location_on
          </span>
          {story.localizacao.nome}
        </a>
      ) : null}
    </div>
  );
};
