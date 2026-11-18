"use client";

import Link from "next/link";
import { MenuModeracao } from "@/app/(app)/moderacao/components/MenuModeracao";
import { useAuth } from "@/hooks/useAuth";
import type { ComentarioPost } from "@/types/post-foto";
import type { AlvoDenuncia } from "@/types/moderacao";
import { formatarDataMeta } from "@/app/(app)/perfil/formatar-data-historico";
import styles from "./comentarios.module.css";

type Props = {
  comentario: ComentarioPost;
  onApagar: (id: string) => void;
  alvoDenuncia?: AlvoDenuncia;
};

export const ItemComentario = ({
  comentario,
  onApagar,
  alvoDenuncia = "comentario_post",
}: Props) => {
  const { usuario } = useAuth();
  const proprio = usuario?.uid === comentario.autor.uid;

  return (
    <li className={styles.comentario}>
      <Link
        href={`/perfil/${encodeURIComponent(comentario.autor.uid)}`}
        aria-label={comentario.autor.apelido}
      >
        {comentario.autor.fotoUrl ? (
          <img
            src={comentario.autor.fotoUrl}
            alt=""
            className={styles.avatarPequeno}
            referrerPolicy="no-referrer"
          />
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
            <button
              type="button"
              className={styles.apagarComentario}
              onClick={() => onApagar(comentario.id)}
            >
              Apagar
            </button>
          ) : null}
          {!proprio ? (
            <MenuModeracao
              contexto="comentario"
              alvoId={comentario.id}
              alvoTipo={alvoDenuncia}
              autorUid={comentario.autor.uid}
              autorApelido={comentario.autor.apelido}
            />
          ) : null}
        </span>
      </div>
    </li>
  );
};
