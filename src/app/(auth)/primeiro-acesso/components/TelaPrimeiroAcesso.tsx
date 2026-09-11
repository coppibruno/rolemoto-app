"use client";

import { useProtecaoRotaPrimeiroAcesso } from "../hooks/useProtecaoRotaPrimeiroAcesso";
import { FormularioPrimeiroAcesso } from "./FormularioPrimeiroAcesso";
import styles from "../primeiro-acesso.module.css";

type Props = {
  next: string | null;
};

export const TelaPrimeiroAcesso = ({ next }: Props) => {
  const { bloqueado } = useProtecaoRotaPrimeiroAcesso(next);

  if (bloqueado) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinnerPagina} />
      </div>
    );
  }

  return (
    <div className={styles.tela}>
      <div className={styles.coluna}>
        <FormularioPrimeiroAcesso next={next} />
      </div>
    </div>
  );
};
