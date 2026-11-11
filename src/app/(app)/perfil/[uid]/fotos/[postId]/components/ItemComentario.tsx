import Link from "next/link";
import type { ComentarioPost } from "@/types/post-foto";
import { formatarDataMeta } from "@/app/(app)/perfil/formatar-data-historico";
import styles from "../post-foto.module.css";

type Props = {
  comentario: ComentarioPost;
  onApagar: (id: string) => void;
};

export const ItemComentario = ({ comentario, onApagar }: Props) => (
  <li className={styles.comentario}>
    <Link href={`/perfil/${encodeURIComponent(comentario.autor.uid)}`} aria-label={comentario.autor.apelido}>
      {comentario.autor.fotoUrl ? (
        <img src={comentario.autor.fotoUrl} alt="" className={styles.avatarPequeno} referrerPolicy="no-referrer" />
      ) : (
        <span className={styles.avatarPequeno} aria-hidden />
      )}
    </Link>
    <div className={styles.comentarioCorpo}>
      <p className={styles.comentarioTexto}>
        <strong>{comentario.autor.apelido}</strong> {comentario.texto}
      </p>
      <span className={styles.comentarioMeta}>
        {formatarDataMeta(comentario.createdAt)}
        {comentario.podeApagar ? (
          <button type="button" className={styles.apagarComentario} onClick={() => onApagar(comentario.id)}>
            Apagar
          </button>
        ) : null}
      </span>
    </div>
  </li>
);
