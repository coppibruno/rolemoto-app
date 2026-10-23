"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import type { MencaoStory, StoryPublica } from "@/types/story-local";
import { urlAbrirMaps } from "@/lib/maps";
import { estiloMarca } from "@/app/(app)/stories/marca-story";
import styles from "./player-stories.module.css";

type Props = {
  story: StoryPublica;
  onSegurar: () => void;
  onSoltar: (evento: ReactPointerEvent<HTMLDivElement>) => void;
  onCancelar: () => void;
  onMarca: (mencao: MencaoStory) => void;
};

export const PalcoFotoStory = ({ story, onSegurar, onSoltar, onCancelar, onMarca }: Props) => {
  const mencao = story.mencao;

  return (
    <div
      className={styles.palco}
      onPointerDown={onSegurar}
      onPointerUp={onSoltar}
      onPointerCancel={onCancelar}
    >
      <img src={story.fotoUrl} alt="" className={styles.foto} />
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
