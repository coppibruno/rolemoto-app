"use client";

import { useState } from "react";
import type { AlvoPostagem, StoryPublica } from "@/types/story-local";
import type { MencaoOpcao } from "@/app/(app)/stories/hooks/usePublicarStoryPerfil";
import { useCapturaFoto } from "@/app/(app)/stories/hooks/useCapturaFoto";
import { ComposerStory } from "@/app/(app)/stories/components/ComposerStory";
import styles from "./botao-postar-story.module.css";

type Props = {
  alvo: AlvoPostagem;
  nome: string;
  onCriada: (story: StoryPublica) => void;
};

const marcaDoAlvo = (alvo: AlvoPostagem, nome: string): MencaoOpcao =>
  alvo.tipo === "local"
    ? { tipo: "local", id: alvo.id, nome, localId: alvo.id }
    : { tipo: "evento", id: alvo.id, nome, localId: alvo.localId };

export const BotaoPostarStory = ({ alvo, nome, onCriada }: Props) => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const captura = useCapturaFoto(setArquivo);

  return (
    <div>
      <input
        ref={captura.inputRef}
        className={styles.input}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        onChange={(evento) => {
          captura.aoArquivo(evento.target.files?.[0]);
          evento.target.value = "";
        }}
      />
      <button type="button" className={styles.botao} onClick={captura.abrir}>
        <span className="material-symbols-outlined" aria-hidden>
          photo_camera
        </span>
        Postar foto
      </button>
      {captura.erro ? (
        <p className={styles.erro} role="alert">
          {captura.erro}
        </p>
      ) : null}
      {arquivo ? (
        <ComposerStory
          arquivo={arquivo}
          marcaInicial={marcaDoAlvo(alvo, nome)}
          onDescartar={() => setArquivo(null)}
          onPublicada={(story) => {
            setArquivo(null);
            onCriada(story);
          }}
        />
      ) : null}
    </div>
  );
};
