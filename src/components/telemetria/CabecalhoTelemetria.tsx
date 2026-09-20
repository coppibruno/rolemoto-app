"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import styles from "./telemetria.module.css";

type Props = {
  titulo: string;
  hrefVoltar?: string;
};

export const CabecalhoTelemetria = ({
  titulo,
  hrefVoltar = "/",
}: Props) => {
  const { usuario } = useAuth();
  const fotoUrl = usuario?.fotoUrl ?? "";
  const nome = usuario?.nome || usuario?.apelido || "";

  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <div className={styles.cabecalhoEsquerda}>
          <Link
            href={hrefVoltar}
            className={styles.botaoVoltar}
            aria-label="Voltar"
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
          <h1 className={styles.tituloPagina}>{titulo}</h1>
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
