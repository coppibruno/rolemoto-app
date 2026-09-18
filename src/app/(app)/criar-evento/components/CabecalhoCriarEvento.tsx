"use client";

import Image from "next/image";
import Link from "next/link";
import { TITULO_PAGINA } from "../constants";
import styles from "../criar-evento.module.css";

type Props = {
  fotoUrl: string;
  nome: string;
};

export const CabecalhoCriarEvento = ({ fotoUrl, nome }: Props) => {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <div className={styles.cabecalhoEsquerda}>
          <Link
            href="/"
            className={styles.botaoVoltar}
            aria-label="Voltar para os rolês"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <Image
            src="/logo-rolemoto.jpeg"
            alt="Rolê Moto"
            width={84}
            height={28}
            className={styles.logo}
            priority
          />
          <h1 className={styles.tituloPagina}>{TITULO_PAGINA}</h1>
        </div>

        <Link href="/perfil" className={styles.avatarHeader} aria-label="Perfil">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={nome ? `Foto de ${nome}` : "Foto de perfil"}
              className={styles.avatarImg}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className={styles.avatarPlaceholder} aria-hidden>
              <span className="material-symbols-outlined">account_circle</span>
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};
