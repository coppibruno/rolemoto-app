"use client";

import type { AlvoPostagem, StoryPublica } from "@/types/story-local";
import { usePostarStory } from "@/app/(app)/stories/hooks/usePostarStory";
import styles from "./botao-postar-story.module.css";

type Props = {
  alvo: AlvoPostagem;
  onCriada: (story: StoryPublica) => void;
};

export const BotaoPostarStory = ({ alvo, onCriada }: Props) => {
  const { inputRef, processando, erro, rotulo, abrir, aoArquivo } = usePostarStory(
    alvo,
    onCriada,
  );

  return (
    <div>
      <input
        ref={inputRef}
        className={styles.input}
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => void aoArquivo(e.target.files?.[0])}
      />
      <button type="button" className={styles.botao} onClick={abrir} disabled={processando}>
        <span className="material-symbols-outlined" aria-hidden>
          photo_library
        </span>
        {rotulo}
      </button>
      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
