"use client";

import { useRegistroFcm } from "../hooks/useRegistroFcm";
import { useProtecaoRotaApp } from "../hooks/useProtecaoRotaApp";
import styles from "../app.module.css";

const RegistroFcm = () => {
  useRegistroFcm();
  return null;
};

export const GuardaApp = ({ children }: { children: React.ReactNode }) => {
  const { loading, autorizado } = useProtecaoRotaApp();

  if (loading || !autorizado) {
    return (
      <div className={styles.loading} role="status" aria-label="Carregando">
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <>
      <RegistroFcm />
      {children}
    </>
  );
};
