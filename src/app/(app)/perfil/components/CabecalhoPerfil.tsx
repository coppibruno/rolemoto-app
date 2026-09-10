"use client";

import Image from "next/image";
import styles from "../perfil.module.css";

type Props = {
  fotoUrl: string;
  nome: string;
};

export const CabecalhoPerfil = ({ fotoUrl, nome }: Props) => {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <div className={styles.cabecalhoMarca}>
          <Image
            src="/logo-rolemoto.png"
            alt="Rolê Moto"
            width={96}
            height={32}
            className={styles.logo}
            priority
          />
          <div className={styles.cabecalhoTitulos}>
            <span className={styles.tituloPagina}>Perfil</span>
            <span className={styles.subtituloPagina}>Cockpit</span>
          </div>
        </div>

        {fotoUrl ? (
          <span className={styles.avatarHeaderWrap}>
            <img
              src={fotoUrl}
              alt={nome ? `Foto de ${nome}` : "Foto de perfil"}
              className={styles.avatarHeader}
              referrerPolicy="no-referrer"
            />
          </span>
        ) : null}
      </div>
    </header>
  );
};
