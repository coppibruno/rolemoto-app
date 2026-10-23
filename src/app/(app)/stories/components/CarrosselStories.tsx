"use client";

import { ComposerStory } from "@/app/(app)/stories/components/ComposerStory";
import { PlayerStories } from "@/app/(app)/components/PlayerStories";
import { useCarrosselStories } from "@/app/(app)/stories/hooks/useCarrosselStories";
import { nomeBolhaStory, rotuloBolhaStory } from "@/app/(app)/stories/pessoas-story";
import type { PessoaStory } from "@/types/story-local";
import styles from "./carrossel-stories.module.css";

const Bolha = ({
  pessoa,
  onAbrir,
}: {
  pessoa: PessoaStory;
  onAbrir: (pessoa: PessoaStory) => void;
}) => (
  <button
    type="button"
    className={styles.bolha}
    aria-label={rotuloBolhaStory(pessoa)}
    onClick={() => onAbrir(pessoa)}
  >
    <span className={`${styles.moldura} ${pessoa.naoVisto ? styles.nova : ""}`}>
      {pessoa.fotoUrl ? (
        <img src={pessoa.fotoUrl} alt="" className={styles.foto} referrerPolicy="no-referrer" />
      ) : (
        <span className={styles.vazio} aria-hidden>
          <span className="material-symbols-outlined">person</span>
        </span>
      )}
    </span>
    <span className={styles.nome}>{nomeBolhaStory(pessoa)}</span>
  </button>
);

export const CarrosselStories = () => {
  const carrossel = useCarrosselStories();
  if (carrossel.carregando && !carrossel.eu) return null;

  return (
    <section aria-label="Stories">
      <ul className={styles.faixa}>
        {carrossel.eu ? (
          <li className={styles.item}>
            <Bolha pessoa={carrossel.eu} onAbrir={carrossel.abrir} />
            {carrossel.eu.contagem > 0 ? (
              <button type="button" className={styles.adicionar} aria-label="Nova foto" onClick={carrossel.novaFoto}>
                <span className={styles.adicionarIcone}>
                  <span className="material-symbols-outlined" aria-hidden>
                    add
                  </span>
                </span>
              </button>
            ) : null}
          </li>
        ) : null}
        {carrossel.outras.map((pessoa) => (
          <li key={pessoa.uid} className={styles.item}>
            <Bolha pessoa={pessoa} onAbrir={carrossel.abrir} />
          </li>
        ))}
      </ul>
      {carrossel.erro ? (
        <p className={styles.aviso}>
          Não foi possível abrir os stories.
          <button type="button" className={styles.tentar} onClick={carrossel.tentarDeNovo}>
            Tentar de novo
          </button>
        </p>
      ) : null}
      {carrossel.erroFoto ? <p className={styles.erroFoto} role="alert">{carrossel.erroFoto}</p> : null}
      <input
        ref={carrossel.inputRef}
        hidden
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        onChange={(evento) => {
          carrossel.aoArquivo(evento.target.files?.[0]);
          evento.target.value = "";
        }}
      />
      {carrossel.arquivo ? (
        <ComposerStory
          arquivo={carrossel.arquivo}
          onDescartar={carrossel.descartar}
          onPublicada={carrossel.publicada}
        />
      ) : null}
      <PlayerStories
        aberto={carrossel.playerAberto}
        alvo={carrossel.alvoId ? { tipo: "usuario", id: carrossel.alvoId } : null}
        inicial={carrossel.inicial}
        destaqueId={carrossel.inicial?.id}
        onFechar={carrossel.fechar}
        onMudou={carrossel.recarregar}
      />
    </section>
  );
};
