"use client";

import Link from "next/link";
import styles from "../feed.module.css";

export const LinksAdminEventos = () => (
  <div className={styles.linksAdminEventos}>
    <Link href="/sugestoes-eventos" className={styles.linkSugestoesEventos}>
      Sugestões
    </Link>
    <Link href="/eventos-passados" className={styles.linkSugestoesEventos}>
      Passados
    </Link>
  </div>
);
