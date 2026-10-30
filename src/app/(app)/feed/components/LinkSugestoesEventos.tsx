"use client";

import Link from "next/link";
import styles from "../feed.module.css";

export const LinkSugestoesEventos = () => {
  return (
    <Link href="/sugestoes-eventos" className={styles.linkSugestoesEventos}>
      Sugestões
    </Link>
  );
};
