"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import styles from "../feed.module.css";

type Props = {
  id: string;
  criadorId: string;
};

export const BotaoParticipar = ({ id, criadorId }: Props) => {
  const { firebaseUser } = useAuth();
  const souLider = firebaseUser?.uid === criadorId;

  if (souLider) {
    return (
      <Link href={`/aprovacoes?role=${id}`} className={styles.botaoParticipar}>
        <span className="material-symbols-outlined">how_to_reg</span>
        Aprovar Pilotos
      </Link>
    );
  }

  return (
    <Link href={`/roles/${id}/participar`} className={styles.botaoParticipar}>
      <span className="material-symbols-outlined">two_wheeler</span>
      Participar do Rolê
    </Link>
  );
};
