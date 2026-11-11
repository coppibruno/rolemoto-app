import Link from "next/link";
import type { AutorPost as Autor } from "@/types/post-foto";
import { formatarDataMeta } from "@/app/(app)/perfil/formatar-data-historico";
import styles from "../post-foto.module.css";

type Props = {
  autor: Autor;
  createdAt: string;
};

export const AutorPost = ({ autor, createdAt }: Props) => (
  <Link href={`/perfil/${encodeURIComponent(autor.uid)}`} className={styles.autor}>
    {autor.fotoUrl ? (
      <img src={autor.fotoUrl} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
    ) : (
      <span className={styles.avatar} aria-hidden>
        <span className="material-symbols-outlined">account_circle</span>
      </span>
    )}
    <span className={styles.autorNome}>{autor.apelido}</span>
    <span className={styles.data}>{formatarDataMeta(createdAt)}</span>
  </Link>
);
