"use client";

import { COPY } from "../constants";
import { useProtecaoRotaDefinirSenha } from "../hooks/useProtecaoRotaDefinirSenha";
import { FormularioDefinirSenha } from "./FormularioDefinirSenha";
import styles from "../definir-senha.module.css";

export const TelaDefinirSenha = ({ next }: { next: string | null }) => {
  const { bloqueado, email } = useProtecaoRotaDefinirSenha(next);

  if (bloqueado) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <main className={styles.tela}>
      <div className={styles.corpo}>
        <header className={styles.hero}>
          <p className={styles.kicker}>{COPY.kicker}</p>
          <h1 className={styles.titulo}>{COPY.titulo}</h1>
          <p className={styles.subtitulo}>{COPY.subtitulo}</p>
        </header>
        {email ? (
          <p className={styles.chipEmail}>
            <span className="material-symbols-outlined" aria-hidden>
              mail
            </span>
            <span>
              Conta: <strong>{email}</strong>
            </span>
          </p>
        ) : null}
        <FormularioDefinirSenha next={next} email={email} />
      </div>
    </main>
  );
};
