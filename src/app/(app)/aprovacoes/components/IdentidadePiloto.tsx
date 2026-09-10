"use client";

import type { UsuarioResumoSolicitacao } from "@/types/aprovacao";
import styles from "../aprovacoes.module.css";

type Props = {
  usuario: UsuarioResumoSolicitacao;
};

export const IdentidadePiloto = ({ usuario }: Props) => {
  return (
    <div className={styles.identidade}>
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
      </div>
    </div>
  );
};
