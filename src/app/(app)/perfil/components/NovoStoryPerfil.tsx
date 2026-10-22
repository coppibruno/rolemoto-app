"use client";

import { useMemo, useRef, useState } from "react";
import { PlayerStories } from "@/app/(app)/components/PlayerStories";
import { useAuth } from "@/hooks/useAuth";
import { usePlayerDetalhe } from "@/app/(app)/stories/hooks/usePlayerDetalhe";
import {
  useMencoesStory,
  usePublicarStoryPerfil,
  type MencaoOpcao,
} from "@/app/(app)/stories/hooks/usePublicarStoryPerfil";
import styles from "../perfil.module.css";

export const NovoStoryPerfil = () => {
  const { usuario } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [busca, setBusca] = useState("");
  const [escolhida, setEscolhida] = useState<MencaoOpcao | null>(null);
  const { opcoes, perto } = useMencoesStory(arquivo !== null);
  const { publicar, enviando, erro, setErro } = usePublicarStoryPerfil();
  const player = usePlayerDetalhe(Boolean(usuario));

  const lista = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase();
    return opcoes
      .filter((item) => !termo || item.nome.toLocaleLowerCase().includes(termo))
      .slice(0, 8);
  }, [busca, opcoes]);

  const fechar = () => {
    setArquivo(null);
    setBusca("");
    setEscolhida(null);
    setErro(null);
  };

  const enviar = async () => {
    if (!arquivo) return;
    const story = await publicar(arquivo, escolhida);
    if (!story || !usuario) return;
    fechar();
    player.abrir(story.id);
  };

  return (
    <section className={styles.cardPonto} aria-label="Novo story">
      <input
        ref={inputRef}
        className={styles.inputStory}
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setArquivo(file);
          e.target.value = "";
        }}
      />
      <button type="button" className={styles.botaoStory} onClick={() => inputRef.current?.click()}>
        <span className="material-symbols-outlined" aria-hidden>
          photo_library
        </span>
        Novo story
      </button>
      {arquivo ? (
        <div className={styles.folhaStory}>
          <p className={styles.cardPontoStatus}>Marque um lugar com @nome para a galera ver também.</p>
          {perto ? (
            <button type="button" className={styles.chipMencao} onClick={() => setEscolhida(perto)}>
              Perto de você · @{perto.nome}
            </button>
          ) : null}
          {escolhida ? (
            <button type="button" className={styles.chipMencaoAtivo} onClick={() => setEscolhida(null)}>
              @{escolhida.nome}
            </button>
          ) : (
            <>
              <input
                className={styles.buscaMencao}
                value={busca}
                placeholder="@evento ou local"
                onChange={(e) => setBusca(e.target.value)}
              />
              <ul className={styles.listaMencao}>
                {lista.map((item) => (
                  <li key={`${item.tipo}-${item.id}`}>
                    <button type="button" className={styles.itemMencao} onClick={() => setEscolhida(item)}>
                      @{item.nome}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {erro ? (
            <p className={styles.cardPontoErro} role="alert">
              {erro}
            </p>
          ) : null}
          <div className={styles.acoesStory}>
            <button type="button" className={styles.botaoPontoSecundario} onClick={fechar} disabled={enviando}>
              Cancelar
            </button>
            <button type="button" className={styles.botaoStory} onClick={() => void enviar()} disabled={enviando}>
              {enviando ? "Enviando foto…" : "Publicar"}
            </button>
          </div>
        </div>
      ) : null}
      {usuario ? (
        <PlayerStories
          aberto={player.aberto}
          alvo={{ tipo: "usuario", id: usuario.uid }}
          destaqueId={player.destaqueId}
          onFechar={player.fechar}
        />
      ) : null}
    </section>
  );
};
