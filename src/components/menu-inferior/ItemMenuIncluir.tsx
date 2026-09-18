"use client";

import Link from "next/link";
import styles from "./menu-inferior.module.css";

type Props = {
  icone: string;
  titulo: string;
  subtitulo: string;
  href?: string;
  desabilitado?: boolean;
  selo?: string;
  onNavigate?: () => void;
};

export const ItemMenuIncluir = ({
  icone,
  titulo,
  subtitulo,
  href,
  desabilitado,
  selo,
  onNavigate,
}: Props) => {
  const conteudo = (
    <>
      <span className={`material-symbols-outlined ${styles.itemMenuIcone}`} aria-hidden>
        {icone}
      </span>
      <span className={styles.itemMenuTextos}>
        <span className={styles.itemMenuTitulo}>{titulo}</span>
        <span className={styles.itemMenuSubtitulo}>{subtitulo}</span>
      </span>
      {selo ? <span className={styles.itemMenuSelo}>{selo}</span> : null}
    </>
  );

  if (desabilitado || !href) {
    return (
      <span
        className={`${styles.itemMenuIncluir} ${styles.itemMenuDesabilitado}`}
        role="menuitem"
        aria-disabled="true"
      >
        {conteudo}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={styles.itemMenuIncluir}
      role="menuitem"
      onClick={onNavigate}
    >
      {conteudo}
    </Link>
  );
};
