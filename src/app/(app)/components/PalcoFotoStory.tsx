"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
} from "react";
import type { CorSelo, MencaoStory, StoryPublica } from "@/types/story-local";
import { urlAbrirMaps } from "@/lib/maps";
import { registrarFotoStory } from "@/app/(app)/stories/cache-foto-story";
import { estiloMarca, estiloSelo } from "@/app/(app)/stories/marca-story";
import { EsqueletoFotoStory } from "./EsqueletoFotoStory";
import styles from "./player-stories.module.css";

type Props = {
  story: StoryPublica;
  onPronta: (storyId: string) => void;
  onSegurar: () => void;
  onSoltar: (evento: ReactPointerEvent<HTMLDivElement>) => void;
  onCancelar: () => void;
  onMarca: (mencao: MencaoStory) => void;
  onPublicacao: (publicacao: NonNullable<StoryPublica["publicacao"]>) => void;
};

export const PalcoFotoStory = ({
  story,
  onPronta,
  onSegurar,
  onSoltar,
  onCancelar,
  onMarca,
  onPublicacao,
}: Props) => {
  const mencao = story.mencao;
  const publicacao = story.publicacao ?? null;
  const lugar = story.localizacao;
  const corMarca: CorSelo = story.marcaCor ?? "neutro";
  const corLugar: CorSelo = lugar?.cor ?? "neutro";
  const posicaoLugar = lugar && lugar.x != null && lugar.y != null
    ? { x: lugar.x, y: lugar.y }
    : null;
  const imgRef = useRef<HTMLImageElement>(null);
  const [prontaId, setProntaId] = useState<string | null>(null);
  const [falhouId, setFalhouId] = useState<string | null>(null);
  const pronta = prontaId === story.id;
  const falhou = falhouId === story.id;

  const marcarPronta = (id: string, url: string) => {
    registrarFotoStory(url);
    setProntaId(id);
  };

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img?.complete || img.naturalWidth === 0) return;
    marcarPronta(story.id, story.fotoUrl);
  }, [story.id, story.fotoUrl]);

  useLayoutEffect(() => {
    if (pronta || falhou) onPronta(story.id);
  }, [falhou, onPronta, pronta, story.id]);

  const aoCarregar = (evento: SyntheticEvent<HTMLImageElement>) => {
    if (evento.currentTarget.naturalWidth === 0) return;
    marcarPronta(story.id, story.fotoUrl);
  };

  return (
    <div
      className={styles.palco}
      onPointerDown={onSegurar}
      onPointerUp={onSoltar}
      onPointerCancel={onCancelar}
    >
      {falhou ? (
        <p className={styles.estado}>Não foi possível carregar a foto.</p>
      ) : (
        <img
          key={story.id}
          ref={imgRef}
          src={story.fotoUrl}
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority="high"
          className={pronta ? `${styles.foto} ${styles.fotoPronta}` : styles.foto}
          onLoad={aoCarregar}
          onError={() => setFalhouId(story.id)}
        />
      )}
      {!pronta && !falhou ? <EsqueletoFotoStory /> : null}
      {pronta && mencao ? (
        <button
          type="button"
          className={styles.selo}
          style={{
            ...estiloMarca(
              story.marcaX != null && story.marcaY != null
                ? { x: story.marcaX, y: story.marcaY }
                : null,
            ),
            ...estiloSelo(corMarca),
          }}
          aria-label={`Abrir ${mencao.nome}`}
          onPointerDown={(evento) => evento.stopPropagation()}
          onPointerUp={(evento) => evento.stopPropagation()}
          onClick={() => onMarca(mencao)}
        >
          @{mencao.nome}
        </button>
      ) : null}
      {pronta && lugar ? (
        <a
          className={posicaoLugar ? styles.localizacaoLivre : styles.localizacao}
          style={
            posicaoLugar
              ? { ...estiloMarca(posicaoLugar), ...estiloSelo(corLugar) }
              : estiloSelo(corLugar)
          }
          href={urlAbrirMaps({
            lat: lugar.lat,
            lng: lugar.lng,
            nome: lugar.nome,
            endereco: "",
          })}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${lugar.nome} no Maps`}
          onPointerDown={(evento) => evento.stopPropagation()}
          onPointerUp={(evento) => evento.stopPropagation()}
          onClick={(evento) => evento.stopPropagation()}
        >
          <span
            className={
              corLugar === "neutro"
                ? `material-symbols-outlined ${styles.pin}`
                : "material-symbols-outlined"
            }
            aria-hidden
          >
            location_on
          </span>
          {lugar.nome}
        </a>
      ) : null}
      {pronta && publicacao ? (
        <button
          type="button"
          className={
            lugar && !posicaoLugar
              ? `${styles.verPublicacao} ${styles.verPublicacaoAcima}`
              : styles.verPublicacao
          }
          aria-label="Ver publicação"
          onPointerDown={(evento) => evento.stopPropagation()}
          onPointerUp={(evento) => evento.stopPropagation()}
          onClick={(evento) => {
            evento.stopPropagation();
            onPublicacao(publicacao);
          }}
        >
          <span className="material-symbols-outlined" aria-hidden>
            grid_view
          </span>
          Ver publicação
        </button>
      ) : null}
    </div>
  );
};
