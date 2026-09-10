"use client";

import type { RoleCriadorResumo } from "@/types/role";
import styles from "../feed.module.css";

type Props = {
  criador: RoleCriadorResumo;
};

export const OrganizadorRole = ({ criador }: Props) => {
  const apelido = criador.apelido || "piloto";

  return (
    <div className={styles.organizador}>
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
    </div>
  );
};
