"use client";

import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { AvatarStories } from "@/app/(app)/components/AvatarStories";
import styles from "../feed.module.css";

export const CabecalhoFeed = () => {
  const { usuario } = useAuth();
  const nome = usuario?.nome ?? "Perfil";
  const fotoUrl = usuario?.fotoUrl ?? "";

  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <h1 className={styles.cabecalhoMarca}>
          <Image
            src="/logo-rolemoto.jpeg"
            alt="Rolê Moto"
            width={96}
            height={32}
            className={styles.logo}
            priority
          />
        </h1>

        {usuario ? (
          <AvatarStories
            uid={usuario.uid}
            fotoUrl={fotoUrl}
            nome={nome}
            tamanho="header"
          />
        ) : null}
      </div>
    </header>
  );
};
