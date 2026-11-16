"use client";

import Link from "next/link";
import { BotaoSeguir } from "@/app/(app)/seguir/components/BotaoSeguir";
import { useAuth } from "@/hooks/useAuth";
import type { RoleCriadorResumo } from "@/types/role";
import styles from "../feed.module.css";

type Props = {
  criador: RoleCriadorResumo;
};

export const OrganizadorRole = ({ criador }: Props) => {
  const { usuario } = useAuth();
  const apelido = criador.apelido || "piloto";
  const mostrarSeguir = Boolean(usuario?.uid) && usuario?.uid !== criador.uid;

  return (
    <div className={styles.organizadorLinha}>
      <Link href={`/perfil/${criador.uid}`} className={styles.organizador}>
        {criador.fotoUrl ? (
          <img
            src={criador.fotoUrl}
            alt=""
            className={styles.organizadorFoto}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={styles.organizadorPlaceholder} aria-hidden>
            <span className="material-symbols-outlined">account_circle</span>
          </span>
        )}
        <span className={styles.organizadorApelido}>@{apelido}</span>
      </Link>
      {mostrarSeguir ? (
        <BotaoSeguir
          uid={criador.uid}
          apelido={apelido}
          seguido={criador.seguidoPorMim === true}
        />
      ) : null}
    </div>
  );
};
