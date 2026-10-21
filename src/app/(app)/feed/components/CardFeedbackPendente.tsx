"use client";

import Link from "next/link";
import styles from "../feed.module.css";

type Props = {
  role: { id: string; titulo: string };
  onDispensar: () => void;
};

export const CardFeedbackPendente = ({ role, onDispensar }: Props) => {
  return (
    <div className={styles.bannerFeedback}>
      <Link href={`/roles/${role.id}/feedback`} className={styles.bannerFeedbackLink}>
        <span className="material-symbols-outlined" aria-hidden>
          star
        </span>
        <span className={styles.bannerTexto}>
          Como foi o <strong>{role.titulo}</strong>? Avalie o rolê.
        </span>
      </Link>
      <button
        type="button"
        className={styles.bannerFechar}
        onClick={onDispensar}
        aria-label="Agora não"
      >
        <span className="material-symbols-outlined" aria-hidden>
          close
        </span>
      </button>
    </div>
  );
};
