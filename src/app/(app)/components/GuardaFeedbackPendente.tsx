"use client";

import { useFeedbackPendenteEntrada } from "../hooks/useFeedbackPendenteEntrada";
import styles from "../app.module.css";

export const GuardaFeedbackPendente = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { liberado } = useFeedbackPendenteEntrada();

  if (!liberado) {
    return (
      <div className={styles.loading} role="status" aria-label="Carregando">
        <div className={styles.spinner} />
      </div>
    );
  }

  return <>{children}</>;
};
