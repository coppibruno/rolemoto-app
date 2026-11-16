import type { AutorPost } from "@/types/post-foto";
import { hrefPerfil, tempoRelativo } from "../atividade-texto";
import { AvatarAtividade } from "./AvatarAtividade";
import styles from "../inicio.module.css";

type Props = {
  autor: AutorPost;
  verbo: string;
  createdAt: string;
  tokenUid: string | undefined;
};

export const CabecalhoCardAtividade = ({ autor, verbo, createdAt, tokenUid }: Props) => (
  <header className={styles.cabecalhoCard}>
    <AvatarAtividade
      uid={autor.uid}
      apelido={autor.apelido}
      fotoUrl={autor.fotoUrl}
      href={hrefPerfil(autor.uid, tokenUid)}
    />
    <div className={styles.cabecalhoTextos}>
      <p className={styles.linhaNome}>
        {autor.apelido} <span className={styles.verbo}>{verbo}</span>
      </p>
      <p className={styles.tempo}>{tempoRelativo(createdAt)}</p>
    </div>
  </header>
);
