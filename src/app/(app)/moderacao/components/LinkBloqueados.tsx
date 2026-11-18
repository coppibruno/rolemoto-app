"use client";

import Link from "next/link";
import styles from "../moderacao.module.css";

export const LinkBloqueados = () => (
  <Link href="/perfil/bloqueados" className={styles.linkBloqueados}>
    <span className="material-symbols-outlined" aria-hidden>
      block
    </span>
    Bloqueados
  </Link>
);
