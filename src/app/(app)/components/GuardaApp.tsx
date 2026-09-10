"use client";

import { useProtecaoRotaApp } from "../hooks/useProtecaoRotaApp";
import styles from "../app.module.css";

export const GuardaApp = ({ children }: { children: React.ReactNode }) => {
  const { loading, autorizado } = useProtecaoRotaApp();

  if (loading || !autorizado) {
    return (
      <div className={styles.loading} role="status" aria-label="Carregando">
        <div className={styles.spinner} />
      </div>
    );
  }

  return <>{children}</>;
};
