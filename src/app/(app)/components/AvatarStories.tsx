"use client";

import { ComposerStory } from "@/app/(app)/stories/components/ComposerStory";
import { PlayerStories } from "@/app/(app)/components/PlayerStories";
import { useAnelStories } from "@/app/(app)/stories/hooks/useAnelStories";
import styles from "./avatar-stories.module.css";

type Props = {
  uid: string;
  fotoUrl: string;
  nome: string;
  tamanho: "header" | "cartao";
};

export const AvatarStories = ({ uid, fotoUrl, nome, tamanho }: Props) => {
  const anel = useAnelStories(uid, nome);

  return (
    <span className={styles.wrap}>
      <input
        ref={anel.inputRef}
        className={styles.input}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        onChange={(evento) => {
          anel.aoArquivo(evento.target.files?.[0]);
          evento.target.value = "";
        }}
      />
      <button
        type="button"
        className={styles.botao}
        aria-label={anel.rotulo}
        aria-expanded={anel.menu}
        onPointerDown={(evento) => evento.stopPropagation()}
        onClick={anel.abrir}
      >
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt=""
            className={`${styles.foto} ${styles[tamanho]} ${anel.tem ? styles.verde : ""}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={`${styles.vazio} ${styles[tamanho]} ${anel.tem ? styles.verde : ""}`} aria-hidden>
            <span className="material-symbols-outlined">person</span>
          </span>
        )}
      </button>
      {anel.erro ? (
        <span className={`${styles.erro} ${tamanho === "header" ? styles.ancoraDireita : ""}`} role="alert">
          {anel.erro}
        </span>
      ) : null}
      {anel.menu ? (
        <span
          className={`${styles.menu} ${tamanho === "header" ? styles.ancoraDireita : ""}`}
          onPointerDown={(evento) => evento.stopPropagation()}
        >
          {anel.opcoes.map((opcao) => (
            <button key={opcao.rotulo} type="button" className={styles.opcao} onClick={opcao.aoClicar}>
              {opcao.rotulo}
            </button>
          ))}
        </span>
      ) : null}
      {anel.arquivo ? (
        <ComposerStory arquivo={anel.arquivo} onDescartar={anel.descartar} onPublicada={anel.publicada} />
      ) : null}
      <PlayerStories
        aberto={anel.player.aberto}
        alvo={{ tipo: "usuario", id: uid }}
        destaqueId={anel.player.destaqueId}
        inicial={anel.player.inicial}
        onFechar={anel.player.fechar}
      />
    </span>
  );
};
