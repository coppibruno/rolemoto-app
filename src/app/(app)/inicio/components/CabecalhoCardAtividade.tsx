import { MenuModeracao } from "@/app/(app)/moderacao/components/MenuModeracao";
import type { AutorPost } from "@/types/post-foto";
import { hrefPerfil, tempoRelativo } from "../atividade-texto";
import { AvatarAtividade } from "./AvatarAtividade";
import styles from "../inicio.module.css";

type Props = {
  autor: AutorPost;
  verbo: string;
  createdAt: string;
  tokenUid: string | undefined;
  atividadeId?: string;
};

export const CabecalhoCardAtividade = ({
  autor,
  verbo,
  createdAt,
  tokenUid,
  atividadeId,
}: Props) => (
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
    {atividadeId && autor.uid !== tokenUid ? (
      <MenuModeracao
        contexto="atividade"
        alvoId={atividadeId}
        autorUid={autor.uid}
        autorApelido={autor.apelido}
      />
    ) : null}
  </header>
);
