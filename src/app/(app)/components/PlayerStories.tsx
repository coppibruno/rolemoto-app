"use client";

import { createPortal } from "react-dom";
import type { AlvoPlayer } from "@/types/story-local";
import { tempoRelativoStory } from "@/app/(app)/stories/formatar-tempo-story";
import { useReelStories } from "@/app/(app)/stories/hooks/useReelStories";
import styles from "./player-stories.module.css";

type Props = {
  aberto: boolean;
  alvo: AlvoPlayer | null;
  destaqueId?: string | null;
  onFechar: () => void;
  onMudou?: () => void;
};

export const PlayerStories = ({ aberto, alvo, destaqueId, onFechar, onMudou }: Props) => {
  const reel = useReelStories({ aberto, alvo, destaqueId, onFechar, onMudou });
  if (!reel.montado || !aberto) return null;

  const story = reel.story;

  return createPortal(
    <div className={styles.player} role="dialog" aria-modal="true" aria-label="Fotos ao vivo">
      <div className={styles.topo}>
        <div className={styles.barras}>
          {reel.stories.map((item, i) => (
            <span key={item.id} className={styles.trilho}>
              <span
                className={styles.preenchimento}
                style={{
                  width: i < reel.indice ? "100%" : i === reel.indice ? `${reel.progresso}%` : "0%",
                }}
              />
            </span>
          ))}
        </div>
        <div className={styles.cabeca}>
          <button type="button" className={styles.fechar} onClick={onFechar} aria-label="Fechar">
            <span className="material-symbols-outlined" aria-hidden>
              close
            </span>
          </button>
          {story ? (
            <>
              {story.autor.fotoUrl ? (
                <img src={story.autor.fotoUrl} alt="" className={styles.avatar} />
              ) : (
                <span className={styles.avatar} />
              )}
              <span className={styles.meta}>
                <span className={styles.apelido}>{story.autor.apelido}</span>
                {story.mencao ? (
                  <span className={styles.mencao}>@{story.mencao.nome}</span>
                ) : null}
                <span className={styles.tempo}>{tempoRelativoStory(story.createdAt)}</span>
              </span>
              {reel.minha ? (
                <button type="button" className={styles.apagar} onClick={() => reel.setConfirmando(true)}>
                  Apagar
                </button>
              ) : null}
            </>
          ) : null}
        </div>
        {reel.confirmando ? (
          <div className={styles.confirma}>
            <span>Apagar esta foto?</span>
            <span className={styles.acoes}>
              <button type="button" className={styles.cancelar} onClick={() => reel.setConfirmando(false)}>
                Cancelar
              </button>
              <button type="button" className={styles.confirmar} onClick={() => void reel.apagar()} disabled={reel.apagando}>
                Apagar
              </button>
            </span>
          </div>
        ) : null}
      </div>
      {story ? (
        <div
          className={styles.palco}
          onPointerDown={reel.segurar}
          onPointerUp={reel.soltar}
          onPointerCancel={reel.cancelarToque}
        >
          <img src={story.fotoUrl} alt="" className={styles.foto} />
        </div>
      ) : (
        <p className={styles.vazio}>{reel.carregando ? "Carregando…" : "Nenhuma foto ao vivo"}</p>
      )}
    </div>,
    document.body,
  );
};
