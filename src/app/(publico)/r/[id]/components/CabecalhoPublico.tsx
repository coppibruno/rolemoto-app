"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { urlLoginComNext } from "@/lib/destino-pos-auth";
import { COPY_PILL } from "../constants";
import styles from "../convite-role.module.css";

type Props = {
  roleId: string;
};

const Marca = () => (
  <>
    <span className={styles.logoIcone} aria-hidden>
      <span className="material-symbols-outlined">bolt</span>
    </span>
    <span className={styles.logoTextos}>
      <span className={styles.logoNome}>
        ROLÊ<span className={styles.logoMoto}>MOTO</span>
      </span>
      <span className={styles.pillConvite}>{COPY_PILL}</span>
    </span>
  </>
);

export const CabecalhoPublico = ({ roleId }: Props) => {
  const { firebaseUser, usuario, loading } = useAuth();
  const convite = `/r/${roleId}`;
  const logado = Boolean(firebaseUser);

  return (
    <header className={styles.cabecalho}>
      {logado ? (
        <Link href="/" className={styles.cabecalhoMarca}>
          <Marca />
        </Link>
      ) : (
        <span className={styles.cabecalhoMarca}>
          <Marca />
        </span>
      )}

      {loading ? (
        <span className={styles.avatarHeader} aria-hidden />
      ) : logado ? (
        <Link href="/" className={styles.avatarHeader} aria-label="Ir ao início">
          {usuario?.fotoUrl ? (
            <img
              src={usuario.fotoUrl}
              alt=""
              className={styles.avatarImg}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className={styles.avatarPlaceholder}>
              <span className="material-symbols-outlined">account_circle</span>
            </span>
          )}
        </Link>
      ) : (
        <Link href={urlLoginComNext(convite)} className={styles.botaoEntrar}>
          Entrar
        </Link>
      )}
    </header>
  );
};
