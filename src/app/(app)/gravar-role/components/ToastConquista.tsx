"use client";

import styles from "./toast-conquista.module.css";

type Props = {
  frases: string[];
};

export const ToastConquista = ({ frases }: Props) => {
  if (frases.length === 0) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className="material-symbols-outlined" aria-hidden>
        military_tech
      </span>
      <ul className={styles.frases}>
        {frases.map((frase) => (
          <li key={frase}>{frase}</li>
        ))}
      </ul>
    </div>
  );
};
