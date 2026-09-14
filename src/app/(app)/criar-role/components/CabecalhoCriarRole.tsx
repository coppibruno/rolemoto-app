"use client";

import Image from "next/image";
import Link from "next/link";
import { TITULO_PAGINA, TITULO_PAGINA_CLONE } from "../constants";
import styles from "../criar-role.module.css";

type Props = {
  fotoUrl: string;
  nome: string;
  modoClone?: boolean;
};

export const CabecalhoCriarRole = ({ fotoUrl, nome, modoClone }: Props) => {
  const hrefVoltar = modoClone ? "/perfil" : "/";
  const ariaVoltar = modoClone ? "Voltar para o perfil" : "Voltar para os rolês";
  const titulo = modoClone ? TITULO_PAGINA_CLONE : TITULO_PAGINA;

  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <div className={styles.cabecalhoEsquerda}>
          <Link
            href={hrefVoltar}
            className={styles.botaoVoltar}
            aria-label={ariaVoltar}
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </Link>
          <Image
            src="/logo-rolemoto.jpeg"
            alt="Rolê Moto"
            width={84}
            height={28}
            className={styles.logo}
            priority
          />
          <h1
            className={`${styles.tituloPagina} ${
              modoClone ? styles.tituloPaginaClone : ""
            }`}
          >
            {titulo}
          </h1>
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
