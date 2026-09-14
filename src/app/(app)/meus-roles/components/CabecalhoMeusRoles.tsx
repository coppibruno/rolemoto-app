"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import styles from "../meus-roles.module.css";

export const CabecalhoMeusRoles = () => {
  const { usuario } = useAuth();
  const nome = usuario?.nome ?? "Perfil";
  const fotoUrl = usuario?.fotoUrl ?? "";

  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <Image
          src="/logo-rolemoto.jpeg"
          alt="Rolê Moto"
          width={96}
          height={32}
          className={styles.logo}
          priority
        />
        <Link href="/perfil" className={styles.avatarHeader} aria-label="Perfil">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={`Foto de ${nome}`}
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
