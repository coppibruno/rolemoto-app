"use client";

import Link from "next/link";
import type { UsuarioResumoSolicitacao } from "@/types/aprovacao";
import { textoRolesRodados } from "../constants";
import styles from "../aprovacoes.module.css";

type Props = {
  usuario: UsuarioResumoSolicitacao;
};

export const IdentidadePiloto = ({ usuario }: Props) => {
  const cidade = (usuario.cidade ?? "").trim();

  return (
    <div className={styles.identidade}>
      <Link
        href={`/perfil/${usuario.uid}`}
        className={styles.identidadeLink}
        aria-label={`Ver perfil de ${usuario.nome}`}
      >
        {usuario.fotoUrl ? (
          <img
            src={usuario.fotoUrl}
            alt={`Foto de ${usuario.nome}`}
            className={styles.avatar}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={styles.avatarPlaceholder} aria-hidden>
            <span className="material-symbols-outlined">account_circle</span>
          </span>
        )}
        <div className={styles.identidadeTextos}>
          <h3 className={styles.nomePiloto}>{usuario.nome}</h3>
          <span className={styles.apelidoPiloto}>@{usuario.apelido}</span>
          {usuario.moto ? (
            <div className={styles.motoPiloto}>
              <span className="material-symbols-outlined" aria-hidden>
                two_wheeler
              </span>
              <span>{usuario.moto}</span>
            </div>
          ) : null}
          {cidade ? (
            <div className={styles.cidadePiloto}>
              <span className="material-symbols-outlined" aria-hidden>
                location_on
              </span>
              <span>{cidade}</span>
            </div>
          ) : null}
          <div className={styles.trajetoriaPiloto}>
            <span className="material-symbols-outlined" aria-hidden>
              sports_score
            </span>
            <span>{textoRolesRodados(usuario.rolesRodados ?? 0)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};
