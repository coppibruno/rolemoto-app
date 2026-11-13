"use client";

import { useRouter } from "next/navigation";
import { useCamadaCheia } from "@/app/(app)/stories/camada-cheia";
import { BuscaMarcaStory } from "@/app/(app)/stories/components/BuscaMarcaStory";
import { EntradaFotoStory } from "@/app/(app)/stories/components/EntradaFotoStory";
import { useBuscaMarca } from "../hooks/useBuscaMarca";
import { useNovaFoto } from "../hooks/useNovaFoto";
import { CampoLegenda } from "./CampoLegenda";
import { EscolhaFoto } from "./EscolhaFoto";
import { InterruptorStory } from "./InterruptorStory";
import { MarcaNovaFoto } from "./MarcaNovaFoto";
import styles from "../nova-foto.module.css";

export const TelaNovaFoto = () => {
  const router = useRouter();
  const nova = useNovaFoto();
  useCamadaCheia(true);
  const busca = useBuscaMarca(nova.setMarca);

  const fechar = () => {
    if (window.history.length > 1) router.back();
    else router.replace("/perfil");
  };

  return (
    <div className={styles.tela} role="dialog" aria-modal="true" aria-label="Nova foto">
      <header className={styles.topo}>
        <button
          type="button"
          className={styles.icone}
          aria-label="Descartar"
          onClick={fechar}
          disabled={nova.enviando}
        >
          <span className="material-symbols-outlined" aria-hidden>
            close
          </span>
        </button>
        <h1 className={styles.titulo}>Nova foto</h1>
        <span className={styles.icone} aria-hidden />
      </header>
      <div className={styles.corpo}>
        <EntradaFotoStory captura={nova.captura} />
        {nova.preview ? (
          <img src={nova.preview} alt="Prévia da foto" className={styles.previa} />
        ) : (
          <EscolhaFoto captura={nova.captura} />
        )}
        <CampoLegenda valor={nova.legenda} onMudar={nova.setLegenda} travado={nova.enviando} />
        <MarcaNovaFoto
          marca={nova.marca}
          travado={nova.enviando}
          onMarcar={busca.abrir}
          onTirar={() => nova.setMarca(null)}
        />
        <InterruptorStory ligado={nova.noStory} travado={nova.enviando} onMudar={nova.setNoStory} />
      </div>
      {busca.aberta ? (
        <>
          <button type="button" className={styles.fundo} aria-label="Fechar busca" onClick={busca.fechar} />
          <BuscaMarcaStory
            termo={busca.termo}
            onTermo={busca.setTermo}
            perto={null}
            lista={busca.lista}
            semResultado={busca.semResultado}
            onEscolher={busca.escolher}
          />
        </>
      ) : null}
      <footer className={styles.rodape}>
        {nova.erro ? (
          <p className={styles.erro} role="alert">
            {nova.erro}
          </p>
        ) : null}
        <button
          type="button"
          className={styles.publicar}
          onClick={() => void nova.publicar()}
          disabled={!nova.arquivo || nova.enviando}
        >
          {nova.enviando ? "Publicando…" : "Publicar"}
        </button>
      </footer>
    </div>
  );
};
