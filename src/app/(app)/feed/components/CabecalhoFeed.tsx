"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import styles from "../feed.module.css";

export const CabecalhoFeed = () => {
  const { usuario } = useAuth();
  const nome = usuario?.nome ?? "Perfil";
  const fotoUrl = usuario?.fotoUrl ?? "";

  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <div className={styles.cabecalhoMarca}>
          <Image
            src="/logo-rolemoto.jpeg"
            alt="Rolê Moto"
            width={96}
            height={32}
            className={styles.logo}
            priority
          />
          <h1 className={styles.tituloPagina}>Feed</h1>
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
