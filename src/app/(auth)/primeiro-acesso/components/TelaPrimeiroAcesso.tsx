"use client";

import { useProtecaoRotaPrimeiroAcesso } from "../hooks/useProtecaoRotaPrimeiroAcesso";
import { FormularioPrimeiroAcesso } from "./FormularioPrimeiroAcesso";
import styles from "../primeiro-acesso.module.css";

export const TelaPrimeiroAcesso = () => {
  const { bloqueado } = useProtecaoRotaPrimeiroAcesso();

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
        <FormularioPrimeiroAcesso />
      </div>
    </div>
  );
};
