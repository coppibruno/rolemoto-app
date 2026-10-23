"use client";

import { createPortal } from "react-dom";
import type { StoryPublica } from "@/types/story-local";
import { useComposerStory } from "@/app/(app)/stories/hooks/useComposerStory";
import type { MencaoOpcao } from "@/app/(app)/stories/hooks/usePublicarStoryPerfil";
import { estiloMarca } from "../marca-story";
import { BuscaMarcaStory } from "./BuscaMarcaStory";
import { SeloMarcaStory } from "./SeloMarcaStory";
import styles from "./composer-story.module.css";

type Props = {
  arquivo: File;
  marcaInicial?: MencaoOpcao | null;
  onDescartar: () => void;
  onPublicada: (story: StoryPublica) => void;
};

export const ComposerStory = ({ arquivo, marcaInicial = null, onDescartar, onPublicada }: Props) => {
  const composer = useComposerStory({ arquivo, marcaInicial, onPublicada });
  if (!composer.preview) return null;

  return createPortal(
    <div ref={composer.stageRef} className={styles.tela} role="dialog" aria-modal="true" aria-label="Nova foto">
      <img src={composer.preview} alt="" className={styles.foto} />
      {composer.buscaAberta && !composer.escolhida ? (
        <button
          type="button"
          className={styles.fundo}
          aria-label="Fechar busca"
          onClick={() => composer.setBuscaAberta(false)}
        />
      ) : null}
      <div className={styles.topo}>
        <button
          type="button"
          className={styles.fechar}
          aria-label="Descartar foto"
          onClick={onDescartar}
          disabled={composer.enviando}
        >
          <span className="material-symbols-outlined" aria-hidden>
            close
          </span>
        </button>
      </div>
      {composer.escolhida ? (
        <SeloMarcaStory
          nome={composer.escolhida.nome}
          posicao={composer.posicao}
          travado={composer.enviando}
          onSegurar={composer.aoSegurarMarca}
          onMover={composer.aoMoverMarca}
          onSoltar={composer.aoSoltarMarca}
          onTirar={composer.tirarMarca}
        />
      ) : (
        <button
          type="button"
          className={styles.marcar}
          style={estiloMarca(null)}
          onClick={() => composer.setBuscaAberta((aberta) => !aberta)}
          disabled={composer.enviando}
        >
          Marcar lugar
        </button>
      )}
      {composer.buscaAberta && !composer.escolhida ? (
        <BuscaMarcaStory
          termo={composer.termo}
          onTermo={composer.setTermo}
          perto={composer.perto}
          lista={composer.lista}
          semResultado={composer.semResultado}
          onEscolher={composer.escolher}
        />
      ) : null}
      <div className={styles.rodape}>
        {composer.erro ? (
          <p className={styles.erro} role="alert">
            {composer.erro}
          </p>
        ) : null}
        <button
          type="button"
          className={styles.publicar}
          onClick={() => void composer.enviar()}
          disabled={composer.enviando}
        >
          {composer.enviando ? "Enviando foto…" : "Publicar"}
        </button>
      </div>
    </div>,
    document.body,
  );
};
