import type { Mensagem } from "@/types/conversa";
import { quandoMensagem } from "../conversa";
import { SeloStory } from "./SeloStory";
import styles from "../mensagens.module.css";

type Props = {
  mensagem: Mensagem;
  minha: boolean;
};

export const BalaoMensagem = ({ mensagem, minha }: Props) => (
  <div className={`${styles.balaoLinha} ${minha ? styles.balaoLinhaMinha : ""}`}>
    <div className={`${styles.balao} ${minha ? styles.balaoMeu : ""}`}>
      {mensagem.story ? <SeloStory story={mensagem.story} /> : null}
      <p className={styles.balaoTexto}>{mensagem.texto}</p>
      <span className={styles.balaoHora}>{quandoMensagem(mensagem.createdAt)}</span>
    </div>
  </div>
);
