"use client";

import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { AlvoPlayer, MencaoStory, StoryPublica } from "@/types/story-local";
import { tempoRelativoStory } from "@/app/(app)/stories/formatar-tempo-story";
import { useReelStories } from "@/app/(app)/stories/hooks/useReelStories";
import { PalcoFotoStory } from "./PalcoFotoStory";
import styles from "./player-stories.module.css";

type Props = {
  aberto: boolean;
  alvo: AlvoPlayer | null;
  destaqueId?: string | null;
  inicial?: StoryPublica | null;
  onFechar: () => void;
  onMudou?: () => void;
};

export const PlayerStories = ({ aberto, alvo, destaqueId, inicial, onFechar, onMudou }: Props) => {
  const router = useRouter();
  const reel = useReelStories({ aberto, alvo, destaqueId, inicial, onFechar, onMudou });
  if (!reel.montado || !aberto) return null;

  const story = reel.story;

  const abrirMarca = (mencao: MencaoStory) => {
    onFechar();
    router.push(mencao.tipo === "local" ? `/locais/${mencao.id}` : `/eventos/${mencao.id}`);
  };

  return createPortal(
    <div className={styles.player} role="dialog" aria-modal="true" aria-label="Fotos">
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
        <PalcoFotoStory
          story={story}
          onSegurar={reel.segurar}
          onSoltar={reel.soltar}
          onCancelar={reel.cancelarToque}
          onMarca={abrirMarca}
        />
      ) : (
        <div className={styles.vazio}>
          {reel.carregando ? (
            <p>Carregando…</p>
          ) : reel.erro ? (
            <>
              <p>Não foi possível abrir as fotos.</p>
              <button type="button" className={styles.tentar} onClick={reel.tentarDeNovo}>
                Tentar de novo
              </button>
            </>
          ) : (
            <p>Nenhuma foto nas últimas 24 h</p>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
};
