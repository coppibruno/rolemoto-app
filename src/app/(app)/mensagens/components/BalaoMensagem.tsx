"use client";

import { useState } from "react";
import type { Mensagem } from "@/types/conversa";
import { COPY_CURTIDA, COPY_REACAO_STORY, COPY_REACAO_STORY_MINHA } from "../constants";
import { quandoMensagem } from "../conversa";
import { useToqueDuplo } from "../hooks/useToqueDuplo";
import { SeloStory } from "./SeloStory";
import styles from "../mensagens.module.css";

type Props = {
  mensagem: Mensagem;
  minha: boolean;
  onAlternarCurtida: (mensagem: Mensagem) => void;
};

export const BalaoMensagem = ({ mensagem, minha, onAlternarCurtida }: Props) => {
  // Muda a cada curtida para remontar o coração grande e tocar a animação de novo.
  const [pulso, setPulso] = useState(0);
  const aoToque = useToqueDuplo(() => {
    if (minha) return;
    if (!mensagem.curtida) setPulso((atual) => atual + 1);
    onAlternarCurtida(mensagem);
  });

  return (
    <div
      className={`${styles.balaoLinha} ${minha ? styles.balaoLinhaMinha : ""} ${
        mensagem.curtida ? styles.balaoLinhaCurtida : ""
      }`}
    >
      <div
        className={`${styles.balaoCurtivel} ${minha ? "" : styles.balaoCurtivelOutro}`}
        onClick={minha ? undefined : aoToque}
      >
        {mensagem.reacao ? (
          <div className={`${styles.balaoReacao} ${minha ? styles.balaoReacaoMinha : ""}`}>
            <span className={styles.reacaoRotulo}>
              {minha ? COPY_REACAO_STORY_MINHA : COPY_REACAO_STORY}
            </span>
            {mensagem.story ? <SeloStory story={mensagem.story} /> : null}
            <span className={styles.reacaoEmoji} role="img" aria-label={`Reação ${mensagem.texto}`}>
              {mensagem.texto}
            </span>
            <span className={styles.balaoHora}>{quandoMensagem(mensagem.createdAt)}</span>
          </div>
        ) : (
          <div className={`${styles.balao} ${minha ? styles.balaoMeu : ""}`}>
            {mensagem.story ? <SeloStory story={mensagem.story} /> : null}
            <p className={styles.balaoTexto}>{mensagem.texto}</p>
            <span className={styles.balaoHora}>{quandoMensagem(mensagem.createdAt)}</span>
          </div>
        )}

        {pulso > 0 && mensagem.curtida ? (
          <span key={pulso} className={styles.coracaoPulso} aria-hidden>
            <span className="material-symbols-outlined">favorite</span>
          </span>
        ) : null}

        {mensagem.curtida ? (
          <span
            className={`${styles.seloCurtida} ${minha ? styles.seloCurtidaMinha : ""}`}
            role="img"
            aria-label={COPY_CURTIDA}
          >
            <span className="material-symbols-outlined">favorite</span>
          </span>
        ) : null}
      </div>
    </div>
  );
};
