"use client";

import { useAuth } from "@/hooks/useAuth";
import { AvatarStories } from "@/app/(app)/components/AvatarStories";
import { LogoRolemoto } from "@/components/marca/LogoRolemoto";
import { BotaoTema } from "@/components/tema/BotaoTema";
import styles from "../perfil.module.css";

type Props = {
  fotoUrl: string;
  nome: string;
};

export const CabecalhoPerfil = ({ fotoUrl, nome }: Props) => {
  const { usuario } = useAuth();

  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <div className={styles.cabecalhoMarca}>
          <LogoRolemoto width={96} height={32} className={styles.logo} priority />
          <div className={styles.cabecalhoTitulos}>
            <span className={styles.tituloPagina}>Perfil</span>
          </div>
        </div>

        <div className={styles.cabecalhoAcoes}>
          <BotaoTema />
          {usuario ? (
            <AvatarStories
              uid={usuario.uid}
              fotoUrl={fotoUrl}
              nome={nome}
              tamanho="header"
            />
          ) : null}
        </div>
      </div>
    </header>
  );
};
