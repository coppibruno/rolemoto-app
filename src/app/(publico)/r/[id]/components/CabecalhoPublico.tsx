"use client";

import Link from "next/link";
import { urlLoginComNext } from "@/lib/destino-pos-auth";
import { COPY_PILL } from "../constants";
import styles from "../convite-role.module.css";

type Props = {
  roleId: string;
  onCompartilhar: () => void;
  feedback: string | null;
  loading?: boolean;
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

export const CabecalhoPublico = ({
  roleId,
  onCompartilhar,
  feedback,
  loading = false,
}: Props) => {
  const convite = `/r/${roleId}`;

  return (
    <header className={styles.cabecalho}>
      <span className={styles.cabecalhoMarca}>
        <Marca />
      </span>

      <div className={styles.cabecalhoAcoes}>
        <button
          type="button"
          className={styles.botaoShareHeader}
          aria-label="Compartilhar"
          onClick={onCompartilhar}
        >
          <span className="material-symbols-outlined">share</span>
        </button>
        {loading ? (
          <span className={styles.avatarHeader} aria-hidden />
        ) : (
          <Link href={urlLoginComNext(convite)} className={styles.botaoEntrar}>
            Entrar
          </Link>
        )}
      </div>

      {feedback ? (
        <span className={styles.toast} role="status">
          {feedback}
        </span>
      ) : null}
    </header>
  );
};
