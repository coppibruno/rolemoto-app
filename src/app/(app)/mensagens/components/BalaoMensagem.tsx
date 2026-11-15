import type { Mensagem } from "@/types/conversa";
import { COPY_REACAO_STORY, COPY_REACAO_STORY_MINHA } from "../constants";
import { quandoMensagem } from "../conversa";
import { SeloStory } from "./SeloStory";
import styles from "../mensagens.module.css";

type Props = {
  mensagem: Mensagem;
  minha: boolean;
};

export const BalaoMensagem = ({ mensagem, minha }: Props) => (
  <div className={`${styles.balaoLinha} ${minha ? styles.balaoLinhaMinha : ""}`}>
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
  </div>
);
