"use client";

import Image from "next/image";
import Link from "next/link";
import {
  TITULO_PAGINA,
  TITULO_PAGINA_CLONE,
  TITULO_PAGINA_EDITAR,
} from "../constants";
import type { ModoCriarRole } from "../types";
import styles from "../criar-role.module.css";

type Props = {
  fotoUrl: string;
  nome: string;
  modo: ModoCriarRole;
};

const TITULOS: Record<ModoCriarRole, string> = {
  criar: TITULO_PAGINA,
  clonar: TITULO_PAGINA_CLONE,
  editar: TITULO_PAGINA_EDITAR,
};

const hrefVoltarDe = (modo: ModoCriarRole): string => {
  if (modo === "editar") return "/meus-roles";
  if (modo === "clonar") return "/perfil";
  return "/";
};

const ariaVoltarDe = (modo: ModoCriarRole): string => {
  if (modo === "editar") return "Voltar para meus rolês";
  if (modo === "clonar") return "Voltar para o perfil";
  return "Voltar para os rolês";
};

export const CabecalhoCriarRole = ({ fotoUrl, nome, modo }: Props) => {
  const hrefVoltar = hrefVoltarDe(modo);
  const titulo = TITULOS[modo];
  const destaque = modo !== "criar";

  return (
    <header className={styles.cabecalho}>
      <div className={styles.cabecalhoInner}>
        <div className={styles.cabecalhoEsquerda}>
          <Link
            href={hrefVoltar}
            className={styles.botaoVoltar}
            aria-label={ariaVoltarDe(modo)}
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
              destaque ? styles.tituloPaginaClone : ""
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
