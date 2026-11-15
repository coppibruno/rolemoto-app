import Link from "next/link";
import type { ConversaItem } from "@/types/conversa";
import { nomeNaConversa, quandoMensagem } from "../conversa";
import { FotoPessoa } from "./FotoPessoa";
import styles from "../mensagens.module.css";

type Props = {
  conversa: ConversaItem;
  meuUid: string;
};

export const LinhaConversa = ({ conversa, meuUid }: Props) => {
  const minha = conversa.ultimaMensagemAutorId === meuUid;
  const naoLida = conversa.naoLida === true;

  return (
    <Link
      href={`/mensagens/${encodeURIComponent(conversa.id)}`}
      className={`${styles.linhaConversa} ${naoLida ? styles.linhaNaoLida : ""}`}
    >
      <FotoPessoa fotoUrl={conversa.outro.fotoUrl} />
      <span className={styles.textos}>
        <span className={styles.nome}>{nomeNaConversa(conversa.outro)}</span>
        <span className={styles.trecho}>
          {minha ? "Você: " : ""}
          {conversa.ultimaMensagemTexto}
        </span>
      </span>
      <span className={styles.quando}>{quandoMensagem(conversa.ultimaMensagemEm)}</span>
      {naoLida ? <span className={styles.pontoNaoLida} aria-label="Não lida" /> : null}
    </Link>
  );
};
