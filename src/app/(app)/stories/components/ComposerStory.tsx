"use client";

import { createPortal } from "react-dom";
import type { StoryPublica } from "@/types/story-local";
import { useComposerStory } from "@/app/(app)/stories/hooks/useComposerStory";
import type { MencaoOpcao } from "@/app/(app)/stories/hooks/usePublicarStoryPerfil";
import { BuscaMarcaStory } from "./BuscaMarcaStory";
import { BuscaLocalizacaoStory } from "./BuscaLocalizacaoStory";
import { PaletaMarcaStory } from "./PaletaMarcaStory";
import { SeloLocalizacaoStory } from "./SeloLocalizacaoStory";
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
  const painelAberto = composer.paletaAberta || composer.buscaAberta || composer.buscaLocal;

  return createPortal(
    <div ref={composer.stageRef} className={styles.tela} role="dialog" aria-modal="true" aria-label="Nova foto">
      <img src={composer.preview} alt="" className={styles.foto} />
      {painelAberto ? (
        <button type="button" className={styles.fundo} aria-label="Fechar" onClick={composer.fecharPaineis} />
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
        <button
          type="button"
          className={composer.paletaAberta ? `${styles.fechar} ${styles.fecharAtivo}` : styles.fechar}
          aria-label="Marcações"
          aria-expanded={composer.paletaAberta}
          onClick={composer.abrirPaleta}
          disabled={composer.enviando}
        >
          <span className="material-symbols-outlined" aria-hidden>
            mood
          </span>
        </button>
      </div>
      {composer.escolhida ? (
        <SeloMarcaStory
          nome={composer.escolhida.nome}
          posicao={composer.posicao}
          cor={composer.corMarca}
          travado={composer.enviando}
          onSegurar={composer.aoSegurar("marca")}
          onMover={composer.aoMover}
          onSoltar={composer.aoSoltar}
          onTirar={composer.tirarMarca}
        />
      ) : null}
      {composer.localizacao ? (
        <SeloLocalizacaoStory
          nome={composer.localizacao.nome}
          posicao={composer.posicaoLocal}
          cor={composer.corLocal}
          travado={composer.enviando}
          onSegurar={composer.aoSegurar("local")}
          onMover={composer.aoMover}
          onSoltar={composer.aoSoltar}
          onTirar={composer.tirarLocalizacao}
        />
      ) : null}
      {composer.paletaAberta ? (
        <PaletaMarcaStory
          temMarca={Boolean(composer.escolhida)}
          temLocal={Boolean(composer.localizacao)}
          onMarca={composer.abrirBusca}
          onLocal={composer.abrirLocalizacao}
        />
      ) : null}
      {composer.buscaLocal ? (
        <BuscaLocalizacaoStory
          termo={composer.termoLocal}
          onTermo={composer.setTermoLocal}
          lugarEncontro={composer.lugarEncontro}
          lista={composer.listaLocal}
          semResultado={composer.semLocal}
          onEscolher={composer.escolherLocalizacao}
        />
      ) : null}
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
