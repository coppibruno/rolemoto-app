"use client";

import Link from "next/link";
import type { AlvoEvento } from "@/types/atividade";
import { dataHoraCurta, ehHrefExterno } from "../atividade-texto";
import styles from "../inicio.module.css";

type Props = {
  alvo: AlvoEvento;
  href: string;
};

export const CorpoEvento = ({ alvo, href }: Props) => {
  const corpo = (
    <>
      <div className={styles.capaRole}>
        {alvo.fotoCapaUrl ? <img src={alvo.fotoCapaUrl} alt="" /> : null}
      </div>
      <div className={styles.blocoConteudo}>
        <h3 className={styles.tituloRole}>{alvo.titulo}</h3>
        <p className={styles.metaRole}>
          {dataHoraCurta(alvo.dataHoraAbertura)} · {alvo.localNome}
        </p>
      </div>
    </>
  );

  if (ehHrefExterno(href)) {
    return (
      <a
        href={href}
        className={styles.linkCorpo}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver ${alvo.titulo}`}
      >
        {corpo}
      </a>
    );
  }

  return (
    <Link href={href} className={styles.linkCorpo} aria-label={`Ver ${alvo.titulo}`}>
      {corpo}
    </Link>
  );
};
